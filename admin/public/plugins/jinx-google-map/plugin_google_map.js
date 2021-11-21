//GOOGLE MAP
(function ( $ ) {

    $.fn.google_map = function( options ) {
        try{
            if(!google) return this;
        }catch(e){
            return this;
        }
        var this_options = {
            lat: 44.8253365,
            lng: 20.4567146,
            zoomLevel: 15, 
            marker: true
        };
        if(options)
            $.extend(this_options, options);

        var mapDiv = $(this)[0];
        var mapOptions = {
            center: new google.maps.LatLng(this_options.lat, this_options.lng),
            zoom: this_options.zoomLevel,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        }
        var map = new google.maps.Map(mapDiv, mapOptions);
        google.maps.event.addListener(map, 'click', function( event ){
            //alert( "Latitude: "+event.latLng.lat()+" "+", longitude: "+event.latLng.lng() ); 
            if(this_options.map_click && typeof this_options.map_click == 'function')
                this_options.map_click(event);
        });
        if(this_options.marker == true)
            var marker = new google.maps.Marker({
                position: new google.maps.LatLng(this_options.lat, this_options.lng),
                map: map
            });
        this.setMap = function(lat, lng){
             var marker = new google.maps.Marker({
                position: new google.maps.LatLng(lat, lng),
                map: map
            });
        }
        return this;
    };
 
}( jQuery ));