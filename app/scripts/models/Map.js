var Backbone = require('backbone');

var Map = Backbone.Model.extend({
    defaults: {
        zoom: 13,
        disableDefaultUI: true,
        mapTypeId: google.maps.MapTypeId.HYBRID,
        lat: 48.160643,
        lng: 24.499927
    },
    initialize: function() {
        var currentLatLng = new google.maps.LatLng(this.get('lat'), this.get('lng'));
        var mapOptions = {
            zoom: this.get('zoom'),
            center: currentLatLng,
            mapTypeId: this.get('mapTypeId'),
            disableDefaultUI: this.get('disableDefaultUI')
        };
        this.set('mapOptions', mapOptions);
    }
});
module.exports = Map;