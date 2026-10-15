<?php

return [
    'name' => 'Inquiry',

    'station' => [
        // A member's statement clears itself from the station screen after this many seconds.
        'idle_seconds' => (int) env('INQUIRY_STATION_IDLE_SECONDS', 30),
    ],

    // Shown at the bottom of a member's statement (station and portal).
    'contact_note' => env('INQUIRY_CONTACT_NOTE', 'For inquiries, please visit the cooperative office.'),

    // Codes accepted in the "Type" column of the savings transactions file.
    // Add a code here if your accounting export uses more than these three.
    'transaction_types' => [
        'RS' => 'Regular Savings',
        'TD' => 'Time Deposit',
        'SC' => 'Share Capital',
    ],

    // Codes accepted in the "Mode" column.
    'transaction_modes' => [
        'D' => 'Deposit',
        'W' => 'Withdrawal',
    ],

    // How many recent transactions a member's statement carries.
    'statement_transactions' => 50,
];
