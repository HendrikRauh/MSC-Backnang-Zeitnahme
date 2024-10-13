const env = {};

module.exports = {
    apps: [
        {
            name: "MSC-Backnang-Zeitnahme",
            script: "app.js",
            watch: false,
            // ignore_watch: ["node_modules", ".git"],
            // watch_delay: 5000,
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
