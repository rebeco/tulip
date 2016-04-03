var Roadbook = Class({
  create: function(opts){
    this.waypoints = ko.observableArray([]);

    /*
      declare some state instance variables
    */
    // this.drawRoute = false; // I don' think this is being used
    this.currentlyEditingCanvas = false;
    this.currentlyEditingTulip = null;
    this.editingNameDesc = false;
    this.newWaypoints = false;

    /*
      declare some observable instance variables
    */
    this.name = ko.observable('Name your roadbook');
    this.desc = ko.observable('Describe your roadbook, click me!');
    this.totalDistance = ko.observable('0.00');

    /*
      Declare some internal variables
    */
    this.filePath = null;
  },

  /*
    ---------------------------------------------------------------------------
      Waypoint management
    ---------------------------------------------------------------------------
  */

  addWaypoint: function(wptData){

    //determine index of waypoint based on distance from start
    var index = this.determineWaypointInsertionIndex(wptData.distances.kmFromStart);
    var waypoint = new Waypoint(this, wptData);

    this.waypoints.splice(index,0,waypoint);
    this.reindexWaypoints();

    //persistence tracking
    this.newWaypoints = true;
    $('#save-roadbook').removeClass('secondary');

    return waypoint;
  },

  deleteWaypoint: function(wptId){
    this.waypoints.splice(wptId - 1,1);
    this.reindexWaypoints();
  },

  /*
    Use a binary search algorithm to determine the index to insert the waypoint into the roadbook
    waypoints array
  */
  determineWaypointInsertionIndex: function(kmFromStart){
    var minIndex = 0;

    var maxIndex = this.waypoints().length - 1;
    var currentIndex;
    var midpoint = this.waypoints().length/2 | 0;
    var currentElement;

    while (minIndex <= maxIndex) {
      currentIndex = (minIndex + maxIndex) / 2 | 0;
      currentElement = this.waypoints()[currentIndex];

      if (currentElement.kmFromStart() < kmFromStart) {
        minIndex = currentIndex + 1;
      }
      else if (currentElement.kmFromStart() > kmFromStart) {
        maxIndex = currentIndex - 1;
      }
      else {
        return currentIndex;
      }
    }
    return Math.abs(~maxIndex);
  },

  reindexWaypoints: function(){
    for(i = 0; i < this.waypoints().length; i++){
      waypoint = this.waypoints()[i];
      waypoint.id = i + 1; //we don't need no zero index
    }
  },

  /*
    ---------------------------------------------------------------------------
      Roadbook edit control flow
    ---------------------------------------------------------------------------
  */

  // Keeps track of which waypoint canvas is being edited so there aren't too many UI controls all at once
  requestCanvasEdit: function(object){
    if(object != this.currentlyEditingTulip){
      if(this.currentlyEditingTulip){
        this.currentlyEditingTulip.finishEdit();
      }
      this.currentlyEditingTulip = object;
      this.currentlyEditingCanvas = true;
      $('#save-roadbook').removeClass('secondary');
      return true;
    }
  },

  // Removes all the edit UI from the roadbook waypoints
  finishCanvasEdit: function(){
    if(this.currentlyEditingCanvas){
      this.currentlyEditingCanvas = false;
      if(this.currentlyEditingTulip !== null){
        this.currentlyEditingTulip.finishEdit();
        this.currentlyEditingTulip = null;
      }
      return true;
    }
  },

  finishNameDescEdit: function(){
    if(this.editingNameDesc == true){
      this.editingNameDesc = false;
      $('#roadbook-desc, #roadbook-name').find('a').show('fast')
      $('#roadbook-desc, #roadbook-name').find(':input').hide('fast');
      return true;
    }
  },

  /*
    ---------------------------------------------------------------------------
      Roadbook persistence
    ---------------------------------------------------------------------------
  */

  save:  function(){
    var roadbookJSON = {
      name: this.name(),
      desc: this.desc(),
      totalDistance: this.totalDistance(),
      filePath: this.filePath,
      waypoints: [],
    }
    points = app.mapEditor.routeMarkers
    // TODO fold waypoint into object instead of boolean so we aren't saving nulls
    for(i = 0; i < points.length; i++){
        var waypointJSON = {
          lat: points[i].getPosition().lat(),
          long: points[i].getPosition().lng(),
          waypoint: points[i].waypoint ? true : false,
          kmFromStart: points[i].waypoint ? points[i].waypoint.kmFromStart() : null,
          kmFromPrev: points[i].waypoint ? points[i].waypoint.kmFromPrev() : null,
          heading: points[i].waypoint ? points[i].waypoint.exactHeading() : null,
          tulipJson: points[i].waypoint ? points[i].waypoint.serializeTulip() : null,
        }

        roadbookJSON.waypoints.push(waypointJSON);
    }
    return roadbookJSON;
  },

  updateTotalDistance: function(){
    if(this.waypoints().length > 0 ){
      this.totalDistance(this.waypoints()[this.waypoints().length - 1].totalDistance());
    } else{
      this.totalDistance(0);
    }
    console.log(this.totalDistance());
  },

});
