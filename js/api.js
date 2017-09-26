


$.ajaxSetup({ cache: false });

get_url = function(random){
  return config.mask_url + random
}

get_image_url = function(){
  var url = config.image_url + '?where={"task":"' + config.task + '"}'
  url = url + "&max_results=1"
  if (config.use_random){
    var random = getRandomInt(1,config.total_num_images)
    url="&page=" +url + random
  } else {
    url = url + "&user_id="+app.login.id+"&token="+app.login.token
  }
  console.log("URL FOR GET IS", url)
  return url
}

get_mask_url = function(image_info){
  var url = config.mask_url + '?where={"mode":"truth","image_id":"' + image_info._id + '"}'
  console.log('Mask URL is', url)
  return url
}

do_eval = function(){
  console.log('DOING EVAL\n\n')

  var data = window.currentData._items[0]

  var profile = store.get('github_profile')
  var score = {'name': app.login.username, 'edit_data_id': data._id}

  if (!app.has_filled){
    if (confirm("Are you sure you want to submit? Remember to double-tap to fill closed shapes.")){

    } else {
      return
    }
  }

  if (draw.history.length == 1 && draw.history[0].length == 0){
    if (confirm("Are you sure you want to submit an empty drawing?")){
      startProgress()
      $('#submit_button').prop('disabled',true);
      var segmentation = roi.getNonZeroPixels()
      stopProgress()
      do_save(score, JSON.stringify(segmentation))

    } else {
      stopProgress()

    }

  } else {
    startProgress()
    $('#submit_button').prop('disabled',true);
    var segmentation = roi.getNonZeroPixels()
    stopProgress()
    do_save(score, JSON.stringify(segmentation))
  }

  //})
}

function create_request(data, url){
  var form = new FormData();
  for (key in data){
    form.append(key, data[key])
  }
  var settings = {
    'async': true,
    'crossDomain': true,
    'url': url,
    'method': 'POST',
    'headers': {
      'cache-control': 'no-cache'
    },
    'processData': false,
    'contentType': false,
    'mimeType': 'multipart/form-data',
    'data': form
  }

  return settings
}

function create_json_request(data, url, auth){

  var settings = {
    'async': true,
    'crossDomain': true,
    'url': url,
    'method': 'POST',
    'headers': {
    },
    'processData': false,
    'data': JSON.stringify(data)
  }

  if (auth){
    settings.headers["authorization"] = auth
  }

  return settings

}

do_save = function(score, edits){
  startProgress()
  var imgbody = {
    'image_id': window.currentData._items[0]._id,
    'pic': edits,
    'mode': 'try',
    'task': config.task,
    //'score': score.accuracy,
    'user_id': app.login.id, //score['name']
    'user_agent': navigator.userAgent,
    'resolution': [window.innerWidth, window.innerHeight]
  }
  var timeDiff = new Date() - app.startTime // in miliseconds
  imgbody["time"] = timeDiff

  var token = "NnrP65CXaSnZ0aLPZ8Ox64d0pDlSKS0R8wpymwLr";
  var settings = create_json_request(imgbody, config.edit_url, token)
  settings.headers['content-type'] = 'application/json'
  /*settings["beforeSend"] = function (xhr) {
    xhr.setRequestHeader ("Authorization", "Basic " + btoa(app.login.id+ ":" + store.get("user_token")));
  }*/
  //settings.headers['username'] = app.login.id
  //settings.headers['password'] = store.get("user_token")
  //settings.url = "://" + app.login.id + ":" + store.get("user_token") + "@" + settings.url.replace("http://", "")
  console.log("settings are", settings)
  settings["error"] = function(e){
    alert("there has been an error", e, "settings were", settings)
    console.log("there has been an error", e, "settings were", settings)

    stopProgress()
    window.appMode = "error"
    show_save({"accuracy": "Err"})
  }

  $.ajax(settings).done(function(response){
    show_save(score)
    console.log("response is", response)
    window.response = response;

    roi.clear()
    add_tp(response.tp)
    add_fp(response.fp)
    add_fn(response.fn)
    roi.insertAbove(fn)

    app.score.dice = response.score;


    var profile = store.get('user_token');
    getUserInfo(profile, function(){
      stopProgress()
      show_save(score)
    })
  })



  //TODO: send a GET to /user/{userID}

}

get_next = function(){

  $('#submit_button').prop('disabled',true);
  startProgress()
  /*$.get(get_url(page), function(data, status, jqXhr){
    view.setZoom(1)
    console.log("data now is", data)
    var truth_data = data._items[0].pic
    window.truthData = truth_data;
    window.currentData = data

    $.get(config.image_url + data._items[0].image_id, function(data, status, jqXhr){
      console.log(data)
      var base_url = data.pic
      base.setSource('data:image/jpeg;base64,'+base_url)

      roi.clear()
      draw.history = [[]]
      window.zoomFactor = 1
      window.panFactor = {x:0, y:0}

      show_eval()
    })


  })*/
  var url = get_image_url()
  get_images(url, function(base_url){
    base.setSource('data:image/jpeg;base64,'+base_url)

    roi.clear()
    draw.history = [[]]
    window.zoomFactor = 1
    tp.clear()
    fp.clear()
    fn.clear()
    view.setZoom(1);
    window.panFactor = {x:0, y:0}

    show_eval()
  })


}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
