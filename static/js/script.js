


        var map = L.map('map').setView([39.00, -75.09], 8);

        /*
        L.tileLayer('http://localhost:8888/v2/new_york_from_osm/{z}/{x}/{y}.png', {
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
            maxZoom: 18
        }).addTo(map);
        */
        L.tileLayer('http://{s}.tile.stamen.com/toner-lite/{z}/{x}/{y}.png', {
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
            maxZoom: 18
        }).addTo(map);




        //var route_geom = new L.geoJson();
        //route_geom.addTo(map);

        //var route_url = 'http://localhost:8082/geoserver/cite/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=cite:Get%20Route&maxFeatures=50&outputFormat=application/json'

        var mapLayers = [];
        var allFeatures = L.featureGroup();

        function genNewFeatureGroup() {
            var fg = new L.featureGroup();
            fg.on('mouseover',highlightFeature);
            fg.on('mouseout',resetHighlight);
            fg.addTo(map);
            return fg;
        }


        var layerCount = 0;
        function onEachFeature(feature, featureLayer) {
            mapLayers[layerCount++] = featureLayer;
        } 

        var lineStyle = {
            "color" : "#ff0000"
        }

        function resetHighlight(e) {
            var lgLayers = e.target.getLayers();
            for (var i = 0; i < lgLayers.length ; i++) {
                lgLayers[i].resetStyle();
                lgLayers[i].setStyle({color: '#00F',
                                      fillOpacity: 0.7});
            }
            info.update();
        }

        function highlightFeature(e) {
            var layer = e.target;

            layer.setStyle({
                weight: 5,
                color: '#F00',
                dashArray: '',
                fillOpacity: 1.0
            });

            if (!L.Browser.ie && !L.Browser.opera) {
                layer.bringToFront();
            }
            //info.update(layer..properties);
            info.update({"desc":layer.getLayers()[0].properties["desc"],"stadiumCount":4});
        }



        /* custom control */
        var info = L.control();

        info.onAdd = function (map) {
            this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
            this.update();
            return this._div;
        };

        // method that we will use to update the control based on feature properties passed
        info.update = function (props) {
            this._div.innerHTML = '<h4>Route:</h4>' +  (props ?
                '<b>' + props.desc + '</b><br />' + props.stadiumCount + ' different stadiums'
                : 'Hover over a route');
        };

        info.addTo(map);


        function handleLayerClick(e) {
            var popup = L.popup({minWidth:300})
            .setLatLng(e.latlng)
            .setContent("<img src=\"http://maps.googleapis.com/maps/api/streetview?size=300x200&location="+e.latlng.lat+","+e.latlng.lng+"&fov=90&heading=235&pitch=10\"/>")
            .openOn(map);
            //alert(e.latlng); // e is an event object (MouseEvent in this case)
        }


        function addIcons(computed_route) {

            var numRouteLegs = computed_route.routeLegs.length;

            for (var i = 0; i < computed_route.routeLegs.length; i++) {
                startMarkerLatLong = computed_route.routeLegs[i]["startLatLong"].reverse();
                //L.marker(startMarkerLatLong.reverse()).bindPopup(computed_route.routeLegs[i].startIconHtml).addTo(map).openPopup();
                var htmlStartIcon = new L.divIcon({html:"<div class='icon-circular'>"+computed_route.routeLegs[i].startIconHtml+"</div>"});
                var startMarker = new L.marker(startMarkerLatLong, {icon:htmlStartIcon}).addTo(map);

                if (i == computed_route.routeLegs.length-1) {
                    endMarkerLatLong = computed_route.routeLegs[i]["endLatLong"].reverse();
                    //L.marker(endMarkerLatLong.reverse()).bindPopup(computed_route.routeLegs[i].endIconHtml).addTo(map).openPopup();
                    var htmlEndIcon = new L.divIcon({html:"<div class='icon-circular'>"+computed_route.routeLegs[i].endIconHtml+"</div>"});
                    var endMarker = new L.marker(endMarkerLatLong, {icon:htmlEndIcon}).addTo(map);
                } 
            }

        }

        function addRoute(computed_route, featureGroup) {
            //var tbl =$("<table/>").attr("id","mytable");
            //$("#div1").append(tbl);

            addIcons(computed_route);

            for(var i=0; i< computed_route.routeLegs.length; i++) {
                //var tr="<tr class=leg"+i+">";
                //var td1="<td>"+computed_route[i]["desc"]+"</td>";
                //var td2="<td>July "+computed_route[i]["date"]+"</td>";
                //var tre="</tr>";

                // also load the data from the url
                $.ajax({
                    dataType: "json",
                    url: computed_route.routeLegs[i]["url"],
                    layerIndex: i,
                    success: function(data) {
                        //L.geoJson(data, {onEachFeature: onEachFeature, style: lineStyle})

                        var myLayer = L.geoJson(data);
                        mapLayers[this.layerIndex] = myLayer;
                        console.log("added to layer "+this.layerIndex);
                        myLayer.on('click', handleLayerClick);
                        showLayer(this.layerIndex, featureGroup);

                        allFeatures.addLayer(myLayer);

                        //var greenIcon = L.icon({
                        //    iconUrl: computed_route.startIconUrl;
                        //});


                        if (!myLayer.hasOwnProperty('properties')) {
                            myLayer.properties = {"desc":computed_route.desc};
                        } else {
                            myLayer.properties["desc"] = computed_route.desc;
                        }
                        map.fitBounds(allFeatures.getBounds());
                        //$(data.features).each(function(key, data) {
                        //    route_geom.addData(data);
                        //});
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        console.log(xhr.status);
                        console.log(thrownError);
                      }
                });

                //$("#mytable").append(tr+td1+td2+tre);

            }
        }

        function menuClickHandler(event) {
            addRoute(event.data.param1, event.data.param2);
        }

        function loadData(inputData) {
            var data = inputData["data"];
            var overlayMaps = {};
        
            for (var i = 0; i < data.length; i++) {
                var desc = data[i]["desc"];
                var count = data[i]["stadiumCount"];

                var fg = genNewFeatureGroup();         
                //addRoute(data[i], fg);
                $("#coolMenuList").append("<li><a id=\"route"+(i+1)+"\" href=\"#\">"+desc+"</a></li>");
                $("#route"+(i+1)).click({param1:data[i],param2:fg}, menuClickHandler);
                //overlayMaps[desc] = fg
            }

            //L.control.layers(null,overlayMaps).addTo(map);
        };

        $("#mytable tr").click(function() {
            $(this).toggleClass("highlight");
        });


        function showLayer(id, featureGroup) {
            var l = mapLayers[id];
            featureGroup.addLayer(l);
        }
        function hideLayer(id,featureGroup) {
            var l = mapLayers[id];
            featureGroup.removeLayer(l);
        }

        function toggleLayer(id, featureGroup) {
            var l = mapLayers[id];
            if (featureGroup.hasLayer(l)) {
                featureGroup.removeLayer(l);
            } else {
                map.panTo(l.getBounds().getCenter());
                featureGroup.addLayer(l);
                map.fitBounds(l.getBounds(),{paddingBottomRight:[150,0]});
            }
        }

        $('#mytable').find('tr').click( function(){
          //alert('You clicked row '+ ($(this).index()+1) );
          toggleLayer($(this).index());
        });

        /*
        $.ajax({
          url: "routes_starting_july21.json",
          dataType: "text",
          success: function(response) {
            var json = $.parseJSON(response);
            loadData(json);
          },
            error: function (err) {
                console.log("AJAX error in request: " + JSON.stringify(err, null, 2));
            }
        });
        */

        $.getJSON( "routes_starting_july21.json", function( data ) {
            loadData(data);
        });

        //$(document).ready(function() {
        //    $('.menu').dropit();
        //});

        $('nav li ul').hide().removeClass('fallback');
        $('nav li').hover(
          function () {
            $('ul', this).stop().slideDown(100);
          },
          function () {
            $('ul', this).stop().slideUp(100);
          }
        );


        //showLayer(0);
        //showLayer(1);
        //showLayer(2);