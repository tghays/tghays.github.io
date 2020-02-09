require([
          "geolocate",
		  "esri/Map",
          "esri/views/MapView",
          "esri/widgets/Locate",
          "esri/widgets/Track",
          "esri/Graphic",
		  "esri/layers/FeatureLayer",
		  "esri/geometry/Polyline",
		  "esri/Graphic",
		  "esri/geometry/support/webMercatorUtils",
		  "dojo/dom",
		  "dojo/promise/all",
		  "dojo/domReady!"
        ], function(geolocate, Map, MapView, Locate, Track, Graphic,FeatureLayer,Polyline,Graphic,webMercatorUtils,dom, all) {

		var fl_url = "https://services5.arcgis.com/FmxVFcLfGZgh8t6m/ArcGIS/rest/services/TrackingLines/FeatureServer/0"
		
		
        var map = new Map({
          basemap: "streets-navigation-vector"
        });
		
		//*** Update lat, lon, zoom and scale ***//
		function logCoordinates(pt) {
			var coords = "Lat/Lon " + pt.latitude + " " + pt.longitude + 
				" | Scale 1:" + Math.round(view.scale * 1) / 1 +
				" | Zoom " + view.zoom;
			console.log(coords);
		}
		
        var view = new MapView({
			container: "viewDiv",
			map: map,
			center: [-40, 28],
			zoom: 2,
			spatialReference: {
			wkid: 102100
			}
        });
		
		//view.watch(["center"], function() {
        //logCoordinates(view.center);
		//});
		
        var track = new Track({
          view: view,
          graphic: new Graphic({
            symbol: {
              type: "simple-marker",
              size: "12px",
              color: "green",
              outline: {
                color: "#efefef",
                width: "1.5px"
              }
            }
          }),
		  scale: 1500,
          useHeadingEnabled: true
        });
        view.ui.add(track, "top-left");
		
		
		var prev_loc = [view.center.longitude,view.center.latitude]
		console.log("prev loc: "+ prev_loc)
		
		
		// GET TRACKING LINE FEATURE LAYER
		var featureLayer = new FeatureLayer({
			url:fl_url
        });
		//map.add(featureLayer);
		
		var test_name = 'DevTeam';
		var path = [];
		
		var polyline = {
		type: "polyline",  // autocasts as new Polyline()
			paths: []
		};
		var polylineSymbol = {
			type: "simple-line",
			color: [226, 119, 40],
			width: 4
		};
		var polylineAtt = {
			name: test_name
		};
		var polylineGraphic = new Graphic({
			geometry: polyline,
			symbol: polylineSymbol,
			attributes: polylineAtt
		});
		
		view.when(function() {
			track.start();
			console.log('tracking on')
		});

		
		function plotPoint () {
			var point = {
				type: "point",  // autocasts as new Point()
				longitude: view.center.longitude,
				latitude: view.center.latitude
			};

			// Create a symbol for drawing the point
			var markerSymbol = {
				type: "simple-marker",  // autocasts as new SimpleMarkerSymbol()
				color: [226, 119, 40]
			};

			// Create a graphic and add the geometry and symbol to it
			var pointGraphic = new Graphic({
				geometry: point,
				symbol: markerSymbol
			});
			view.graphics.add(pointGraphic)
		}
		
		var new_feat = false;
		var init_oid = 0
		featureLayer
			.applyEdits({
				addFeatures: [polylineGraphic]
			})
			.then(function(FeatureEditResult) {
				// Get the objectId of the newly added feature.
				if (FeatureEditResult.addFeatureResults.length > 0) {
					const objectId = FeatureEditResult.addFeatureResults[0].objectId;
					console.log("init oid: " + objectId);
					init_oid = objectId;
				} else {
					console.log('did not get oid')
				}
			})
			.catch(function(error) {
				console.log("===============================================");
				console.error("[ applyEdits ] FAILURE: ", error.code, error.name, error.message);
				console.log("error = ", error);
			});
		
		function checkLocation() {
			if (track.tracking == true) {
				current_loc = [view.center.longitude,view.center.latitude]
				if (current_loc[0] != prev_loc[0] && current_loc[1] != prev_loc[1]) {
					console.log("center location changing " + current_loc)
					if (new_feat == false) {
						polylineGraphic.geometry = polyline
						console.log("created / added new feature")
						new_feat = true
					} else {
						// update previously created feature record
						polyline.paths.push(current_loc)
						polylineGraphic.geometry = polyline
						polylineAtt['objectId'] = init_oid
						polylineGraphic.setAttribute("objectId",init_oid)
						featureLayer
							.applyEdits({
								updateFeatures: [polylineGraphic]
							})
							.then(function(FeatureEditResult) {
								// Get the objectId of the newly added feature.
								if (FeatureEditResult.updateFeatureResults.length > 0) {
									const objectId = FeatureEditResult.updateFeatureResults[0].objectId;
									console.log("updated oid " + objectId);
								} else {
									console.log('did not edit oid')
								}
							})
							.catch(function(error) {
								console.log("===============================================");
								console.error("[ applyEdits ] FAILURE: ", error.code, error.name, error.message);
								console.log("error = ", error);
							});
						console.log('updated existing feature')
					}
				} else {
					console.log("location not currently changing")
				}
				prev_loc = [view.center.longitude,view.center.latitude]
			} else {
				console.log('tracking off')
				if (new_feat != false) {
					clearInterval(interval_checkLocation);
					console.log('tracking interval stopped')
				}
			}

		};
		
		var interval_checkLocation = setInterval(checkLocation, 500);
		

		
		setTimeout(function() {
			plotPoint()
			console.log('plotted point')
			
			// PUT THIS ABOVE checkLocation, CREATE FEATURE INITIALLY, THEN UPDATE VIA OBJECTID
			
			
			//console.log(promise.objectId)
		},15000);
	
	
		setTimeout(function() {
			view.graphics.add(polylineGraphic)
			console.log('added graphic')
		},2000);
	
	
		
		// GET USER INPUT FOR NAME
		function PopUp(hideOrshow) {
			if (hideOrshow == 'hide') document.getElementById('ac-wrapper').style.display = "none";
			else document.getElementById('ac-wrapper').removeAttribute('style');
		}
		PopUp('hide')

	  
});
