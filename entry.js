// NoService/services/NoServiceManager/entry.js
// Description:
// "NoServiceManager/entry.js" .
// Copyright 2018 NOOXY. All Rights Reserved.
let NoServiceManager = new (require('./NoServiceManager'))()
// Service entry point
function Service(Me, API) {
  // Your service entry point
  // Get the service socket of your service
  let ss = API.Service.ServiceSocket;
  let Utils = API.Library.Utilities;
  // BEWARE! To prevent callback error crash the system.
  // If you call an callback function which is not API provided. Such as setTimeout(callback, timeout).
  // You need to wrap the callback funciton by API.SafeCallback.
  // E.g. setTimeout(API.SafeCallback(callback), timeout)
  let safec = API.SafeCallback;
  // Your settings in manifest file.
  let settings = Me.Settings;
  let services_path = __dirname.split('/'+Me.Manifest.name)[0];
  let ServiceAPI = API.Service;

  // import API to NoServiceManager module
  NoServiceManager.importModel(API.Database.Model);
  NoServiceManager.importLibrary(API.Library);
  NoServiceManager.importMe(Me);
  NoServiceManager.importDaemon(API.Daemon);
  NoServiceManager.importServiceAPI(ServiceAPI);

  ss.sdef('createService', (json, entityID, returnJSON)=>{
    NoServiceManager.createService(json.name, json.type, (err)=> {
      let jsonr = {
        // succeess
        s: "succeess"
      };
      if(err)
        jsonr.s = err.toString();

      returnJSON(false, jsonr);
    });
  });

  ss.sdef('getDependStack', (json, entityID, returnJSON)=> {
    let jsonr = {
      r: NoServiceManager.returnDependStack()
    };
    returnJSON(false, jsonr);
  });

  ss.sdef('listServicesRepoBind', (json, entityID, returnJSON)=> {
    NoServiceManager.getServiceRepositoryBindList((err, list)=> {
      returnJSON(false, {s: err?err:'succeess', r: list});
    });
  });

  ss.sdef('bindServiceRepo', (json, entityID, returnJSON)=> {
    NoServiceManager.bindServiceToRepository(json.n, (err)=> {
      returnJSON(false, {s: err?err:'succeess'});
    });
  });

  ss.sdef('bindAllServiceRepo', (json, entityID, returnJSON)=> {
    NoServiceManager.bindAllServiceToRepository((err)=> {
      returnJSON(false, {s: err?err:'succeess'});
    });
  });

  ss.sdef('unbindAllServiceRepo', (json, entityID, returnJSON)=> {
    NoServiceManager.unbindAllServiceFromRepository((err)=> {
      returnJSON(false, {s: err?err:'succeess'});
    });
  });

  ss.sdef('unbindServiceRepo', (json, entityID, returnJSON)=> {
    NoServiceManager.unbindServiceFromRepository(json.n, (err)=> {
      returnJSON(false, {s: err?err:'succeess'});
    });
  });

  ss.sdef('installService', (json, entityID, returnJSON)=> {
    API.Authorization.Authby.Password(entityID, (err, valid)=> {
      let method = json.m; // git
      let source = json.s; // github gitlab
      let repo =json.r;

      let jsonr = {
        // succeess
        s: "succeess"
      };

      if(method = 'git') {
        if(source = 'github') {
          NoServiceManager.installService(settings.git_sources[source]+repo, (err)=> {
            if(err)
              jsonr.s = err;
            returnJSON(false, jsonr);
          });
        }
        else {
          jsonr.s = 'Unsupport source '+json.s;
          returnJSON(false, jsonr);
        }
      }
      else {
        jsonr.s = 'Unsupport method '+json.m;
        returnJSON(false, jsonr);
      }
    });
  });

  ss.sdef('upgradeAllService', (json, entityID, returnJSON)=> {
    NoServiceManager.upgradeAllService((err)=> {
      returnJSON(false, {s: err?err:'succeess'});
    });
  });

  ss.sdef('upgradeService', (json, entityID, returnJSON)=> {
    NoServiceManager.upgradeService(json.n, (err)=> {
      returnJSON(false, {s: err?err:'succeess'});
    });
  });

  ss.sdef('killService', (json, entityID, returnJSON)=> {

  });

  this.start = ()=> {

    // memoryUsage limit control
    setInterval(()=> {
      if(settings.reach_memory_limit_relaunch) {
        API.Service.getWorkerMemoryUsage((err, servicememuse)=> {
          for(let service in servicememuse) {
            if(servicememuse[service].rss > settings.max_memory_per_service_MB*1024*1024) {
              console.log('Service "'+service+'" reached memoryUsage limit "'+servicememuse[service].rss/(1024*1024)+'/'+settings.max_memory_per_service_MB+'" MB.');
              API.Service.relaunch(service);
            }
          }
        });
      }
    }, settings.check_memory_interval_sec*1000);

    NoServiceManager.launchOtherServices(()=> {

    });
  }

  // If the daemon stop, your service recieve close signal here.
  this.close = ()=> {
    NoServiceManager.close();
    // Saving state of you service.
  }
}


// Export your work for system here.
module.exports = Service;
