<?php

return [
    'name' => 'Loan',

    'sms' => [
        // log             = write the message to storage/logs/laravel.log (development only)
        // android_gateway = send through your own Android phone with the SMS Gateway app (free, uses your SIM)
        'driver' => env('LOAN_SMS_DRIVER', 'log'),

        'android_gateway' => [
            // Full endpoint, e.g. http://192.168.1.50:8080/messages (local mode)
            // or https://api.sms-gate.app/3rdparty/v1/messages (cloud mode).
            'url' => env('SMSGATE_URL'),
            'username' => env('SMSGATE_USERNAME'),
            'password' => env('SMSGATE_PASSWORD'),
            'timeout' => (int) env('SMSGATE_TIMEOUT', 10),
            // Optional SIM slot (1 to 3) on dual-SIM phones.
            'sim_number' => env('SMSGATE_SIM'),
        ],
    ],

    'portal' => [
        // Member-code sign-in protection (wrong codes only).
        'login_max_attempts' => 5,        // per typed code + IP
        'login_ip_max_attempts' => 20,    // per IP, across all codes
        'login_lockout_minutes' => 15,
        'session_max_hours' => 8,
    ],
];
