$(document).ready(function() {
  $("#mytags").tagit();

  $('form').submit(function(event) {
    event.preventDefault();
    
    var errors = false;

    if (errors) return false;

    return true;
  });
});