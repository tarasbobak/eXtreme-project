var $ = require('jquery'),
    _ = require('underscore'),
    Backbone = require('backbone');

var DrawMapView = Backbone.View.extend({
    initialize: function() {
        var colors = ['#000000','#2980B9', '#27AE60', '#E67E22', '#E74C3C', '#8E44AD'],
            labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            labelIndex = 0;
        var polyOptions = {
                strokeWeight: 0,
                fillColor: '#000000',
                fillOpacity: 0.4,
                editable: true,
                draggable: true
            };
        this.drawingManager = new google.maps.drawing.DrawingManager({
            map: this.model.map,
            markerOptions: {
                draggable: true
            },
            polylineOptions: {
                editable: true,
                draggable: true,
                strokeWeight: 3,
                strokeColor: '#000000'
            },
            rectangleOptions: polyOptions,
            circleOptions: polyOptions,
            polygonOptions: polyOptions,
        });
        this.shapes = [];
        google.maps.event.addListener(this.drawingManager, 'overlaycomplete', (function(e) {
            var newShape = e.overlay;
            newShape.type = e.type;
            if (newShape.type !== 'marker') {
                this.drawingManager.setDrawingMode(null);
                google.maps.event.addListener(newShape, 'click', (function(e) {
                    if (e.vertex != undefined) {
                        var path = newShape.getPath();
                        path.removeAt(e.vertex);
                        if (path.length == 2 && newShape.type == 'polygon' || path.length < 2) {
                            newShape.setMap(null);
                            this.shapesDelete(newShape);
                        }
                    }
                    this.setSelection(newShape);
                }).bind(this));
                this.setSelection(newShape);
            } else {
                this.setSelection(newShape);
                this.selectedShape.setLabel(labels[labelIndex]);
                labelIndex++;
                google.maps.event.addListener(newShape, 'click', (function() {
                    this.setSelection(newShape);
                }).bind(this));
            }
            this.onNewShape(newShape);
        }).bind(this));
        _.bindAll(this, 'clearSelection', 'saveShapes');
        google.maps.event.addListener(this.drawingManager, 'drawingmode_changed', this.clearSelection);
        google.maps.event.addListener(this.model.map, 'click', this.clearSelection);
        this.render(colors);
    },
    render: function(colors) {
        $('#drawing_controls').empty();
        var button, deleteButton;
        colors.forEach((function(color) {
            button = $('<div class="color-button"></div>');
            button.css('background-color', color);
            google.maps.event.addDomListener(button[0], 'click', (function() {
                this.selectColor(color);
                this.setSelectedShapeColor(color);
                this.onColorChange();
            }).bind(this));
            $('#drawing_controls').append(button);
        }).bind(this));
        saveShapeButton = $('<button/>', {
            type: 'button',
            class: 'saveShape-button'
        }).text('Save Shape');
        google.maps.event.addDomListener(saveShapeButton[0], 'click', (function(){
            this.clearSelection();
        }).bind(this));
        $('#drawing_controls').append(saveShapeButton);
        deleteButton = $('<button/>', {
            type: 'button',
            class: 'delete-button'
        }).text('Delete');
        google.maps.event.addDomListener(deleteButton[0], 'click', (function() {
            if (this.selectedShape) {
                this.selectedShape.setMap(null);
                this.shapesDelete(this.selectedShape);
                this.saveShapes();
            }
        }).bind(this));
        $('#drawing_controls').append(deleteButton);
        return this;
    },
    selectColor: function(color) {
        var polylineOptions, rectangleOptions, circleOptions, polygonOptions;
        polylineOptions = this.drawingManager.get('polylineOptions');
        polylineOptions.strokeColor = color;
        this.drawingManager.set('polylineOptions', polylineOptions);
        rectangleOptions = this.drawingManager.get('rectangleOptions');
        rectangleOptions.fillColor = color;
        this.drawingManager.set('rectangleOptions', rectangleOptions);
        circleOptions = this.drawingManager.get('circleOptions');
        circleOptions.fillColor = color;
        this.drawingManager.set('circleOptions', circleOptions);
        polygonOptions = this.drawingManager.get('polygonOptions');
        polygonOptions.fillColor = color;
        this.drawingManager.set('polygonOptions', polygonOptions);
    },
    setSelectedShapeColor: function(color) {
        if (this.selectedShape) {
            if (this.selectedShape.type == 'polyline') {
                this.selectedShape.set('strokeColor', color);
            } else {
                this.selectedShape.set('fillColor', color);
            }
        }
    },
    setSelection: function(shape) {
        if (shape.type !== 'marker') {
            this.clearSelection();
            shape.setEditable(true);
            this.selectColor(shape.get('fillColor') || shape.get('strokeColor'));
        }
        this.selectedShape = shape;
    },
    clearSelection: function() {
        if (this.selectedShape) {
            if (this.selectedShape.type !== 'marker') {
                this.selectedShape.setEditable(false);
            }
            this.selectedShape = null;
        }
    },
    onNewShape: function(shape){
        this.newShapeAddListeners(shape);
        this.shapes.push(shape);
        this.saveShapes();
    },
    onColorChange: function(){
        if (this.selectedShape){
            this.saveShapes();
        }
    },
    newShapeAddListeners: function(shape){
        var path, paths, pathsLength;
        switch (shape.type) {
        case 'marker':
            google.maps.event.addListener(shape, 'dragend', this.saveShapes);
            break;
        case 'rectangle':
            google.maps.event.addListener(shape, 'bounds_changed', this.saveShapes);
            break;
        case 'circle':
            google.maps.event.addListener(shape, 'center_changed', this.saveShapes);
            google.maps.event.addListener(shape, 'radius_changed', this.saveShapes);
            break;
        case 'polyline':
            path = shape.getPath();
            this.newShapeAddPathListeners(shape, path);
            break;
        case 'polygon':
            paths = shape.getPaths();
            pathsLength = paths.getLength();
            for (var i = 0; i < pathsLength; i++) {
                path = paths.getAt(i);
                this.newShapeAddPathListeners(shape, path);
            }
            break;
        default:
            throw new Error('Shape type is incorrect');
        }
    },
    newShapeAddPathListeners: function(shape, path){
        google.maps.event.addListener(path, 'insert_at', this.saveShapes);
        google.maps.event.addListener(path, 'remove_at', this.saveShapes);
        google.maps.event.addListener(path, 'set_at', this.saveShapes);
    },
    saveShapes: function(){
        var shapesData = this.jsonMake();
        localStorage.setItem('shapesData', shapesData);
    },
    shapesDelete: function(shape){
        var found = false,
            shapesLength = this.shapes.length;
        for (var i = 0; i < shapesLength && !found; i++) {
            if (this.shapes[i] === shape) {
                this.shapes.splice(i, 1);
                found = true;
            }
        }
    },
    drawGPSTrack: function(trackCoordinates){
        var latLngBounds = new google.maps.LatLngBounds();
        trackCoordinates.forEach(function(point){
            latLngBounds.extend(new google.maps.LatLng(point.lat, point.lng));
        })
        this.model.map.setCenter(latLngBounds.getCenter());
        this.model.map.fitBounds(latLngBounds);
        var track = new google.maps.Polyline({
            map: this.model.map,
            path: trackCoordinates,
            editable: false,
            strokeColor: '#000000',
            strokeWeight: 3
        });
        track.type = 'polyline';
        this.model.map.fitBounds(latLngBounds);
        this.setSelection(track);
        google.maps.event.addListener(track, 'click', (function(e) {
                    if (e.vertex != undefined) {
                        var path = track.getPath();
                        path.removeAt(e.vertex);
                        if (path.length < 2) {
                            track.setMap(null);
                            this.shapesDelete(track);
                        }
                    }
                    this.setSelection(track);
        }).bind(this));
        this.onNewShape(track);
    },
    jsonMake: function(){
        var json = '{"shapes":[';
        this.shapes.forEach((function(shape, index){
            if (index !== 0){
                json += ',';
            }
            switch(shape.type){
                case 'marker':
                    json += '{' + this.jsonMakeMarker(shape) + '}';
                    break;
                case 'rectangle':
                    json += '{' + this.jsonMakeRectangle(shape) + '}';
                    break;
                case 'circle':
                    json += '{' + this.jsonMakeCircle(shape) + '}';
                    break;
                case 'polyline':
                    json += '{' + this.jsonMakePolyline(shape) + '}';
                    break;
                case 'polygon':
                    json += '{' + this.jsonMakePolygon(shape) + '}';
                    break;
                default:
                    throw new Error('Shape type is incorrect');
            }
        }).bind(this));
        json += '], "map": {' + this.jsonMakeMapData() + '}}';
        return json;
    },
    jsonMakeMarker: function(marker){
        var json =    this.jsonMakeType(marker) + ','
                    + '"position":{"lat":"' + marker.getPosition().lat() + '",'
                                + '"lon":"' + marker.getPosition().lng() + '"},'
                    + '"label":"' + marker.label + '"';
        return json;
    },
    jsonMakeRectangle: function(rectangle){
        var json =    this.jsonMakeType(rectangle) + ','
                    + this.jsonMakeColor(rectangle.fillColor) + ','
                    + this.jsonMakeBounds(rectangle);
        return json;
    },
    jsonMakeCircle: function(circle){
        var json =    this.jsonMakeType(circle) + ','
                    + this.jsonMakeColor(circle.fillColor) + ','
                    + this.jsonMakeCenter(circle) + ','
                    + this.jsonMakeRadius(circle);
        return json;
    },
    jsonMakePolyline: function(polyline){
        var json =    this.jsonMakeType(polyline) + ','
                    + this.jsonMakeColor(polyline.strokeColor) + ','
                    + this.jsonMakePath(polyline.getPath());
        return json;
    },
    jsonMakePolygon: function(polygon){
        var json =    this.jsonMakeType(polygon) + ','
                    + this.jsonMakeColor(polygon.fillColor) + ','
                    + this.jsonMakePaths(polygon.getPaths());
        return json;
    },
    jsonMakeType: function(shape){
        return '"type":"' + shape.type + '"';
    },
    jsonMakeColor: function(color){
        return '"color":"' + color + '"';
    },
    jsonMakeBounds: function(shape){
        return '"bounds":{'
                    + '"northEast":{'
                        + '"lat":"' + shape.bounds.getNorthEast().lat() + '",'
                        + '"lon":"' + shape.bounds.getNorthEast().lng() + '"},'
                    + '"southWest":{'
                        + '"lat":"' + shape.bounds.getSouthWest().lat() + '",'
                        + '"lon":"' + shape.bounds.getSouthWest().lng() + '"}'
                + '}';
    },
    jsonMakeCenter: function(circle){
        return '"center":{'
                    + '"lat":"' + circle.center.lat() + '",'
                    + '"lon":"' + circle.center.lng() + '"'
                + '}';
    },
    jsonMakeRadius: function(circle){
        return '"radius":"' + circle.radius + '"';
    },
    jsonMakePath: function(path){
        var n = path.getLength(),
            latlon, json;
        json = '"path":[';
        for (var i = 0; i < n; i++) {
            latlon = path.getAt(i);
            if (i !== 0){
                json += ',';
            }
            json += '{' + '"lat":"' + latlon.lat() + '",' + '"lon":"' + latlon.lng() + '"}';
        }
        json += ']';
        return json;
    },
    jsonMakePaths: function(paths){
        var n = paths.getLength(),
            path, json;
        json = '"paths":[';
        for (var i = 0; i < n; i++) {
            path = paths.getAt(i);
            if (i !== 0){
                json += ',';
            }
            json += '{' + this.jsonMakePath(path) + '}';
        }
        json += ']';
        return json;
    },
    jsonMakeMapData: function(){
        return '"lat": ' + this.model.map.getCenter().G + ',"lon": ' + this.model.map.getCenter().K
    }
});
module.exports = DrawMapView;