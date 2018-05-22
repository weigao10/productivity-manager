//file to get sample data chunks
const activeWin = require('active-win');
const moment = require('moment');
const electron = require('electron')
const { ipcMain, session } = electron;
const axios = require('axios');
const chalk = require('chalk');
const path = require('path');

const { serverURL } = require(path.join(__dirname, '../config.js'));

const monitorActivity = (activities, user) => {
  return activeWin()
    .then((data) => {
      let newActivity = assembleActivity(data);
      let lastActivity = activities[activities.length - 1];
      if (needToInitializeChunk(lastActivity)) activities.push(newActivity);
      else if (chunkComplete(lastActivity, newActivity)) {
        lastActivity.endTime = timestamp();
        activities.push(newActivity);
        return lastActivity;
      }
    })
    .then((lastActivity) => {
      if (lastActivity) { //only bother if lastActivity not undefined
        const qs = {
          user_name: user,
          app_name: lastActivity.app,
          window_title: lastActivity.title
        }
        return axios.get(serverURL + '/api/classifications', {params: qs})
          .then((resp) => {
            if (typeof resp.data !== 'object') console.log(chalk.blue('RECEIVED PROD OBJ FROM SERVER THAT IS NOT OBJECT!'))
            return {
              ...lastActivity,
              productivity: resp.data
            };
          })
          .catch((err) => console.log(err))
      }
    })
    .catch((e) => {
      console.log('error in activity monitor is', e)
    })
};

const timestamp = () => {
  return moment().format('MMMM Do YYYY, h:mm:ss a');
};

const assembleActivity = (activeWinObj) => {
  const title = stripEmoji(activeWinObj.title); // filter out the sound playing emoji
  return {
    id: activeWinObj.id,
    app: activeWinObj.owner.name,
    title, 
    startTime: timestamp()
  };
};

const stripEmoji = (title) => {
  const indexOfEmoji = title.indexOf('🔊'); //indicates a window is playing sound
  if (indexOfEmoji > -1) {
    const noEmoji = title.replace('🔊', '');
    return noEmoji.substring(0, noEmoji.length - 1);
  } else return title;
}

const needToInitializeChunk = (lastActivity) => {
  return !lastActivity;
};

const chunkComplete = (lastActivity, newActivity) => {
  if (needToInitializeChunk(lastActivity)) return false;
  return (lastActivity.app !== newActivity.app) || (lastActivity.title !== newActivity.title);
};

const startMonitor = (mainWindow, activities = [], user = "test") => {
  // console.log('MONITOR WAS STARTED FOR USER', user)
  return setInterval(() => {
    monitorActivity(activities, user)
      .then((data) => {
        if (data) {
          mainWindow.sender.webContents.send('activity', data)
        }
      })
      .catch((err) => console.error('error in activity monitor', err))
  }, 1000)
}

//closure variables

let intervalId = false;
let activities = [];
let user = '';

exports.monitor = (mainWindow, mainSession) => {
  ipcMain.on('monitor', (mainWindow, event, message) => {
    // console.log('activity monitor received instruction of', event, message)
    if (event === 'start') {
      user = message;
      activities = [];
      intervalId = startMonitor(mainWindow, activities, message);
    } else if (event === 'pause' && intervalId) {
      clearInterval(intervalId);
      // console.log('next activity should be last activity before sleep!')
      monitorActivity(activities, user); // ♫ ♬ ONE LAST/MORE TIME ♩ ♬ 
      intervalId = false;
    } else {
      console.error('activity monitor did not understand instruction', event, message);
    }
  });
};

exports.stopMonitorProcess = () => {
  if (intervalId) clearInterval(intervalId);
};

exports.restartMonitorProcess = (mainWindow, mainSession) => {
  intervalId = startMonitor(mainWindow, activities, user);
}

/*
ideas for tests:
make sure chunks are properly assembled by making sure it's not making a new chunk every second
make sure entire time period is covered by chunks
*/