$(document).ready(function () {
  var iOS = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
  var $geoLocation = $("#geo-location");
  if (!$geoLocation) return;
  if (iOS) {
    $geoLocation.attr(
      "href",
      "comgooglemaps://?center=40.765819,-73.975866&zoom=14&views=traffic"
    );
    $geoLocation.text(
      "comgooglemaps://?center=40.765819,-73.975866&zoom=14&views=traffic"
    );
  } else {
    $geoLocation.attr("href", "geo:40.765819,-73.975866");
    $geoLocation.text("geo:40.765819,-73.975866");
  }
});
