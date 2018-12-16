var nodecast = require('nodecast');
var inquirer = require('inquirer');
var getYouTubeID = require('get-youtube-id');
var fetchVideoInfo = require('youtube-info');
var prettyjson = require('prettyjson');

var stop = false;
var stopall = false;
var id;

if(process.argv[2] === "stop") {
    stop = true;
} else if(process.argv[2] === "stopall") {
    stopall = true;
} else {
    id = getYouTubeID(process.argv[2], {fuzzy: false})
    if(id === null) {
        console.log('Invalid Youtube link')
        process.exit()
    }
}

var devices = nodecast.find();
var knownDevices = []

devices.on('device', function(device) {
    knownDevices.push(device)
});
setTimeout(function(){
    if(stopall) {
        for (var i = 0; i < knownDevices.length; i++){
            let device = knownDevices[i];
            let yt = device.app('YouTube');
            yt.stop(function(err){
                console.log('Stopped', device.name)
            })
        }
        process.exit()
    } else {
        var names = []
        for (var i = 0; i < knownDevices.length; i++) {
            names.push(knownDevices[i].name)
        }
        var question = {
            type:'list',
            name:'Select device',
            choices:names
        }
        inquirer.prompt([question]).then(answers => {
            var device = knownDevices.find(obj => {
                return obj.name === answers['Select device']
            })
            var yt = device.app('YouTube');
            if(stop) {
                yt.stop(function(err){
                    if(!err) {
                        console.log(device.name,'casting stopped')
                    }
                    process.exit()
                })
            } else {
                yt.start('v='+id, function(err){
                    fetchVideoInfo(id, function (err, videoInfo) {
                        if (err) throw new Error(err);
                        delete videoInfo.description;
                        delete videoInfo.regionsAllowed;
                        delete videoInfo.channelThumbnailUrl;
                        delete videoInfo.channelId;
                        delete videoInfo.embedURL;
                        console.log(prettyjson.render(videoInfo));
                        process.exit()
                    });
                })
            }
        });
    }
},1000)
