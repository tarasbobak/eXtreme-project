var $ = require('jquery'),
    _ = require('underscore'),
    Backbone = require('backbone'),
    Map = require('../models/Map'),
    ShapesView = require('./ShapesView'),
    RenderCanvasView = require('./RenderCanvasView'),
    carousel = require('../carousel/owl-carousel'),
    template = require('./templates/articleTemplate.html');

var ArticleView = Backbone.View.extend({
    el: $('.east_side'),
    template: template,
    initialize: function() {
        if (this.model.attributes.map) {
            this.model.map = new Map({
                'lat': this.model.attributes.map.lat,
                'lng': this.model.attributes.map.lon,
                'zoom': 13
            });
        }
        this.render();
    },
    render: function() {
        this.$el.empty();
        this.$el.html(this.template(this.model.toJSON()));
        if (this.model.attributes.map) {
            var mapContainer = document.getElementsByClassName('itinerary_cont')[0];
            var shapesView = new ShapesView({
                model: this.model,
                mapContainer: mapContainer
            });
        } else {
            this.$el.find('.itinerary').hide();
        }

        if (this.model.attributes.imgUrl && this.model.attributes.tracks) {
            this.renderCanvas = new RenderCanvasView({
                model: this.model
            });
        }

        $("#owl-demo").owlCarousel({
            autoPlay: 3000,
            items: 4,
            itemsDesktop: [1199, 3],
            itemsDesktopSmall: [480, 2],
            itemTablet: [320, 1]
        });
    }
});
module.exports = ArticleView;