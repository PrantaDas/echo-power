const { appendFileSync, openSync, closeSync } = require("fs");
const { exec } = require("child_process");
const os = require("os");
const path = require("path");

const filePath = path.join(process.cwd(), 'batteryInfo.txt');
let interval;
let isUnplugged = false;


function logger(data = []) {
    const time = new Date().toLocaleString();
    for (const line of data) {
        appendFileSync(filePath, `${line} - ${time}\n`);
    }
}


function checker() {
    exec("upower -i /org/freedesktop/UPower/devices/battery_BAT0", (err, stdout) => {
        if (err) return console.error(err);
        if (!stdout.includes("state: charging") && !isUnplugged) {
            logger(['UPLUGGED THE CHARGER , BATTERY IS NOT CHARGING']);
            isUnplugged = true;
            return;
        }

        if (stdout.includes('percentage:')) {
            let percentage = stdout.match(/(\d+%)/g)[0];
            logger([`Battery percentage: ${percentage}`]);
            percentage = percentage.substring(0, percentage.length - 1);
            if (percentage < 5) exec("shutdown now -h");
        }
    });
}


(async () => {
    closeSync(openSync(filePath, 'w'));
    if (os.platform() === 'linux') {
        interval = setInterval(checker, 30000);
    }
})();

process.on('SIGINT', () => {
    clearInterval(interval);
    console.log('Shutting down...');
    logger(['SIGINT signal received', 'Shuting down...']);
    exec("shutdown -h now");
});