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
		  "esri/tasks/support/Query",
		  "dojo/dom",
		  "dojo/promise/all",
		  "dojo/domReady!"
        ], function(geolocate, Map, MapView, Locate, Track, Graphic,FeatureLayer,Polyline,Graphic,webMercatorUtils,Query, dom, all) {

		var fl_url = "https://services5.arcgis.com/FmxVFcLfGZgh8t6m/ArcGIS/rest/services/TrackingLines/FeatureServer/0"
		
		
        var map = new Map({
          basemap: "streets-navigation-vector"
        });
		
        var view = new MapView({
			container: "viewDiv",
			map: map,
			center: [-40, 28],
			zoom: 2,
			spatialReference: {
			wkid: 102100
			}
        });
		
		var today = new Date();
		var dd = String(today.getDate()).padStart(2, '0');
		var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
		var yyyy = today.getFullYear();

		today = mm + '/' + dd + '/' + yyyy;
		console.log(today);
				
		defn = "CreationDate > '02/09/2020'"
		console.log(defn)
		var featureLayer = new FeatureLayer({
			url:fl_url,
			definitionExpression: defn
        });
		//featureLayer.refreshInterval = 0.05;
		console.log("set refresh interval")
		console.log(featureLayer)
		map.add(featureLayer);
		
		view.zoom = 16;
		
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
			name: ''
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
		
		view.graphics.add(polylineGraphic)
		
		function getMostRecent() {
			console.log('going to feature layer')
			// var maxOIDDefinition = {
				// onStatisticField: "objectid",
				// outStatisticFieldName: "MaxID",
				// statisticType: "max"
			// };

			var query = featureLayer.createQuery();
			//query.outStatistics = [maxOIDDefinition]
			query.where = defn;
			query.outFields = ["OBJECTID"];
			query.returnGeometry = true;
			featureLayer.queryFeatures(query)
				.then(function(response){
					maxOIDObject = response.features[response.features.length-1];
					coords = webMercatorUtils.xyToLngLat(maxOIDObject.geometry.paths[0][maxOIDObject.geometry.paths[0].length-1][0],maxOIDObject.geometry.paths[0][maxOIDObject.geometry.paths[0].length-1][1]);
					view.goTo(coords);
					polylineGraphic.geometry = maxOIDObject.geometry
					
				});
			
			//view.goTo(featureLayer)
			
		};
		
		
		
		var interval_getMostRecent = setInterval(getMostRecent, 500);
		
		
});
