const env = {};

module.exports = {
    apps: [
        {
            name: "MSC-Backnang-Zeitnahme",
            script: "out/app.js",
            watch: ["out"],
            instances: 1, // 0 means as many instances as you have cores
            exp_backoff_restart_delay: 100,
            env: env,
            error_file: "logs/error.log",
            out_file: "logs/out.log",
            log_file: "logs/combined.log",
            log_date_format: "YYYY-MM-DD HH:mm:ss",
        },
    ],
};
