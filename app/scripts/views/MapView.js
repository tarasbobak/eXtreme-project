var $ = require('jquery'),
    Backbone = require('backbone');

var MapView = Backbone.View.extend({
    initialize: function(options){
        var json = this.model.attributes;
        this.model.map = new google.maps.Map(options.mapContainer, this.model.map.attributes.mapOptions);
        this.jsonRead(json);
    },
    jsonRead: function(json){
        var marker, rectangle, circle, polyline, polygon;
        this.latLngBounds = new google.maps.LatLngBounds();
        json.shapes.forEach((function(shape, index){
            switch (shape.type) {
            case 'marker':
                marker = this.jsonReadMarker(shape);
                break;
            case 'rectangle':
                rectangle = this.jsonReadRectangle(shape);
                break;
            case 'circle':
                circle = this.jsonReadCircle(shape);
                break;
            case 'polyline':
                polyline = this.jsonReadPolyline(shape);
                break;
            case 'polygon':
                polygon = this.jsonReadPolygon(shape);
                break;
            }
        }).bind(this));
        this.model.map.fitBounds(this.latLngBounds);
    },
    jsonReadMarker: function(jsonMarker){
        var position, markerOptions, marker;
        position = new google.maps.LatLng(jsonMarker.position.lat, jsonMarker.position.lon);
        markerOptions = {
            position: position,
            editable: false,
            label: jsonMarker.label,
            map: this.model.map
        };
        marker = new google.maps.Marker(markerOptions);
        this.latLngBounds.extend(position);
        return marker;
    },
    jsonReadRectangle: function(jsonRectangle){
        var southWest, northEast, bounds, rectangleOptions;
        southWest = new google.maps.LatLng(jsonRectangle.bounds.southWest.lat, jsonRectangle.bounds.southWest.lon);
        northEast = new google.maps.LatLng(jsonRectangle.bounds.northEast.lat, jsonRectangle.bounds.northEast.lon);
        bounds = new google.maps.LatLngBounds(southWest, northEast);
        rectangleOptions = {
            strokeWeight: 0,
            bounds: bounds,
            editable: false,
            fillColor: jsonRectangle.color,
            fillOpacity: 0.4,
            map: this.model.map
        };
        rectangle = new google.maps.Rectangle(rectangleOptions);
        this.latLngBounds.extend(southWest);
        this.latLngBounds.extend(northEast);
        return rectangle;
    },
    jsonReadCircle: function(jsonCircle){
        var center, circleOptions, circle;
        center = new google.maps.LatLng(jsonCircle.center.lat, jsonCircle.center.lon);
        circleOptions = {
            strokeWeight: 0,
            center: center,
            radius: parseFloat(jsonCircle.radius),
            editable: false,
            fillColor: jsonCircle.color,
            fillOpacity: 0.5,
            map: this.model.map
        };
        circle = new google.maps.Circle(circleOptions);
        this.latLngBounds.union(circle.getBounds());
        return circle;
    },
    jsonReadPolyline: function(jsonPolyline){
        var path, polylineOptions, polyline;
        path = this.jsonReadPath(jsonPolyline);
        polylineOptions = {
            path: path,
            editable: false,
            strokeColor: jsonPolyline.color,
            map: this.model.map
        };
        polyline = new google.maps.Polyline(polylineOptions);
        path.forEach((function(el){
            this.latLngBounds.extend(new google.maps.LatLng(el.G, el.K));
        }).bind(this));
        return polyline;
    },
    jsonReadPolygon: function(jsonPolygon){
        var paths, polygonOptions, polygon;
        paths = new google.maps.MVCArray();
        jsonPolygon.paths.forEach((function(path){
            paths.push(this.jsonReadPath(path));
        }).bind(this));
        polygonOptions = {
            strokeWeight: 0,
            paths: paths,
            editable: false,
            fillColor: jsonPolygon.color,
            fillOpacity: 0.5,
            map: this.model.map
        };
        polygon = new google.maps.Polygon(polygonOptions);
        polygon.getPath().forEach((function(element,index){
            this.latLngBounds.extend(element)
        }).bind(this));
        return polygon;
    },
    jsonReadPath: function(jsonPath){
        var path = new google.maps.MVCArray();
        jsonPath.path.forEach((function(el){
            path.push(new google.maps.LatLng(el.lat, el.lon));
        }).bind(this));
        return path;
    }
});
module.exports = MapView;