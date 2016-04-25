var gutil = require('gulp-util');
var colors = gutil.colors;

var redText = function(msg) { return colors.red(msg); };
var redBoldText = function(msg) { return colors.red.bold(msg); };
var greenText = function(msg) { return colors.green(msg); };
var greenBoldText = function(msg) { return colors.green.bold(msg); };

logError = function(task, errorMsg) {
    var taskText = redBoldText("\n" + task + ":\n");
    var errText = redText(errorMsg);
    gutil.log(taskText, errText);
};

logStatus = function(statusMsg) {
    var statusText = greenBoldText(statusMsg);
    gutil.log(statusText);
};

wrapStatus = function(taskName, streamFunc) {
    logStatus(taskName + " Started.");
    return streamFunc()
        .on('end', function() {
            logStatus(taskName + " Complete.");
        });
};

module.exports = {
    redText: redText,
    redBoldText: redBoldText,
    greenText: greenText,
    greenBoldText: greenBoldText,
    logError: logError,
    logStatus: logStatus,
    wrapStatus: wrapStatus
};
