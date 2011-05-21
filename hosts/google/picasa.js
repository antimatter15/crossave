/*
  do not venture below, i hate this.
  wont bother seeing if https works
*/
var GoogleOAUTH = ChromeExOAuth.initBackgroundPage({
  'request_url' : 'https://www.google.com/accounts/OAuthGetRequestToken',
  'authorize_url' : 'https://www.google.com/accounts/OAuthAuthorizeToken',
  'access_url' : 'https://www.google.com/accounts/OAuthGetAccessToken',
  'consumer_key' : 'anonymous',
  'consumer_secret' : 'anonymous',
  'scope' : 'https://docs.google.com/feeds/ https://picasaweb.google.com/data/',
  'app_name' : 'cloudsave'
});


Hosts.picasa = function uploadPicasa(req, callback){
  // Constants for various album types.
  var PICASA = 'picasa';
  var ALBUM_TYPE_STRING = {
    'picasa': 'Picasa Web Albums'
  };
  
  getBuffer(req, function(file){
    var builder = new BlobBuilder();
    builder.append(file.data);
    
  
  
  function complete(resp, xhr){
    var prs = JSON.parse(resp);
    console.log(resp, xhr);
    var href = prs.entry.link.filter(function(e){return e.type.indexOf('image/') == 0})[0].href
    callback({url: href});
    
  }
  
  
  function createAlbum(){
      console.log('creating cloudsave album')
      GoogleOAUTH.sendSignedRequest(
        'https://picasaweb.google.com/data/feed/api/user/default',
        function(resp){
          var j = JSON.parse(resp);
          uploadImage(j.entry.gphoto$id.$t);
        },
        {
          method: 'POST',
          headers: {
            'Content-Type': "application/atom+xml"
          },
          parameters: {
            alt: 'json'
          },
          body: "<entry xmlns='http://www.w3.org/2005/Atom' \
xmlns:media='http://search.yahoo.com/mrss/'\
    xmlns:gphoto='http://schemas.google.com/photos/2007'>\
  <title type='text'>cloudsave</title>\
  <summary type='text'>Files uploaded with cloudsave.</summary>\
  <category scheme='http://schemas.google.com/g/2005#kind'\
    term='http://schemas.google.com/photos/2007#album'></category>\
</entry>"
        });
  }
  
  
  function uploadImage(albumId){
      console.log('uploading image');
      GoogleOAUTH.sendSignedRequest(
        'https://picasaweb.google.com/data/feed/api/' +
        'user/default/albumid/'+albumId,
        complete,
        {
          method: 'POST',
          headers: {
            'Content-Type': file.type,
            'Slug': file.name
          },
          parameters: {
            alt: 'json'
          },
          body: builder.getBlob(file.type)
        });
        
  
  }
  
  
  

    GoogleOAUTH.authorize(function() {
      console.log("yay authorized");
      
       GoogleOAUTH.sendSignedRequest(
        'https://picasaweb.google.com/data/feed/api/user/default',
        function(resp, xhr) {
          if (!(xhr.status >= 200 && xhr.status <= 299)) {
            alert('Error: Response status = ' + xhr.status +
                  ', response body = "' + xhr.responseText + '"');
            return;
          }
          var jsonData = JSON.parse(resp);
          var albumId;
          for(var index = 0; index < jsonData.feed.entry.length; index++){
            var entryData = jsonData.feed.entry[index];
            if(/cloudsave/.test(entryData.title['$t'])){
              albumId = entryData['gphoto$id']['$t']
              console.log('found a cloudsave album');
            }
          }
          if(albumId){
          
            uploadImage(albumId);
          }else{

            createAlbum();
          }
        },
        {method: 'GET', parameters: {'alt': 'json'}})
    });
  });
}
