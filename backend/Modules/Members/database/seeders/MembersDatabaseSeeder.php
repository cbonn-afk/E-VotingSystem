<?php

declare(strict_types=1);

namespace Modules\Members\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Members\Models\Member;

/**
 * Sample member list shared by Election, Loan and Inquiry.
 * Includes a few edge cases so every screen has something to show:
 *   inactive: M-0009, M-0021, M-0035 | past due: M-0013, M-0027 | underage: M-0040.
 * Safe to run again: members are matched by member_code.
 */
final class MembersDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $members = [
            ['M-0001', 'Tony Stark', '+12125550101', '1998-02-04', '200 Park Ave, New York, NY 10166', '2020-06-05', 'active', false],
            ['M-0002', 'Steve Rogers', '+17185550102', '1991-07-02', '569 Leaman Pl, Brooklyn, NY 11201', '2018-10-26', 'active', false],
            ['M-0003', 'Natasha Romanoff', '+12025550103', '1980-06-23', '1600 K St NW, Washington, DC 20006', '2018-08-03', 'active', false],
            ['M-0004', 'Bruce Banner', '+15055550104', '1965-05-16', '742 Evergreen Rd, Albuquerque, NM 87101', '2014-12-23', 'active', false],
            ['M-0005', 'Thor Odinson', '+15055550105', '1979-11-19', '1 Asgard Way, Santa Fe, NM 87501', '2019-07-22', 'active', false],
            ['M-0006', 'Clint Barton', '+13195550106', '1982-01-15', '88 Maple St, Cedar Rapids, IA 52401', '2014-08-02', 'active', false],
            ['M-0007', 'Wanda Maximoff', '+19735550107', '1973-05-05', '12 Westview Ln, Westview, NJ 07003', '2017-08-03', 'active', false],
            ['M-0008', 'Carol Danvers', '+13375550108', '1970-08-13', '450 Air Force Blvd, Houston, TX 77001', '2020-07-28', 'active', false],
            ['M-0009', 'Scott Lang', '+14155550109', '1995-05-23', '95 Ant St, San Francisco, CA 94103', '2018-06-22', 'inactive', false],
            ['M-0010', 'Stephen Strange', '+12125550110', '1984-04-05', '177A Bleecker St, New York, NY 10012', '2015-11-08', 'active', false],
            ['M-0011', 'Bruce Wayne', '+16095550111', '1960-08-27', '1007 Mountain Dr, Gotham, NJ 07030', '2016-01-05', 'active', false],
            ['M-0012', 'Clark Kent', '+17855550112', '1986-09-12', '344 Clinton St, Smallville, KS 66002', '2015-12-28', 'active', false],
            ['M-0013', 'Diana Prince', '+12025550113', '1992-10-21', '1 Embassy Row NW, Washington, DC 20008', '2022-12-02', 'active', true],
            ['M-0014', 'Barry Allen', '+15745550114', '1989-11-26', '221 Flash Ave, Central City, MO 64101', '2020-07-13', 'active', false],
            ['M-0015', 'Hal Jordan', '+17075550115', '1985-07-04', '300 Test Pilot Rd, Coast City, CA 95401', '2019-11-13', 'active', false],
            ['M-0016', 'Arthur Curry', '+12075550116', '1963-04-03', '5 Lighthouse Pt, Amnesty Bay, ME 04101', '2015-08-06', 'active', false],
            ['M-0017', 'Oliver Queen', '+12065550117', '1967-06-20', '1 Queen Plaza, Seattle, WA 98101', '2012-02-01', 'active', false],
            ['M-0018', 'Dinah Lance', '+12065550118', '1996-03-18', '410 Canary Ct, Seattle, WA 98104', '2013-06-20', 'active', false],
            ['M-0019', 'Selina Kyle', '+16095550119', '1961-02-28', '27 East End Ave, Gotham, NJ 07030', '2015-10-13', 'active', false],
            ['M-0020', 'Barbara Gordon', '+16095550120', '1969-11-09', '1711 Gordon Ln, Gotham, NJ 07030', '2017-10-12', 'active', false],
            ['M-0021', 'Victor Stone', '+13135550121', '1990-02-04', '6 Cyber Dr, Detroit, MI 48201', '2019-08-16', 'inactive', false],
            ['M-0022', 'Kara Danvers', '+13125550122', '1990-05-03', '1000 Catco Plaza, Chicago, IL 60601', '2014-02-24', 'active', false],
            ['M-0023', 'Billy Batson', '+12155550123', '1981-12-09', '81 Shazam St, Philadelphia, PA 19103', '2019-12-06', 'active', false],
            ['M-0024', 'Matt Murdock', '+12125550124', '1993-01-07', '57 W 57th St, New York, NY 10019', '2020-06-05', 'active', false],
            ['M-0025', 'Jessica Jones', '+12125550125', '1994-01-25', '15 Alias Ave, New York, NY 10001', '2020-05-21', 'active', false],
            ['M-0026', 'Luke Cage', '+12125550126', '1965-12-28', '125 W 125th St, New York, NY 10027', '2016-09-12', 'active', false],
            ['M-0027', 'Danny Rand', '+12125550127', '1970-06-25', '1 Rand Tower, New York, NY 10020', '2015-09-18', 'active', true],
            ['M-0028', 'Frank Castle', '+17185550128', '1992-06-21', '9 Hells Kitchen Rd, Queens, NY 11101', '2015-10-26', 'active', false],
            ['M-0029', 'Logan Howlett', '+14035550129', '1972-04-27', '40 Claw Trail, Bozeman, MT 59715', '2018-12-26', 'active', false],
            ['M-0030', 'Charles Xavier', '+18455550130', '1974-04-17', '1407 Graymalkin Ln, Salem Center, NY 10560', '2019-06-24', 'active', false],
            ['M-0031', 'Ororo Munroe', '+19075550131', '1961-01-26', '22 Storm Way, Anchorage, AK 99501', '2016-08-09', 'active', false],
            ['M-0032', 'Scott Summers', '+19075550132', '1972-12-20', '18 Optic Blvd, Anchorage, AK 99502', '2017-08-26', 'active', false],
            ['M-0033', 'Jean Grey', '+18455550133', '1982-06-03', '3 Phoenix Ct, Salem Center, NY 10560', '2015-02-08', 'active', false],
            ['M-0034', 'Hank McCoy', '+18455550134', '1990-04-11', '71 Beast Ln, Salem Center, NY 10560', '2015-08-20', 'active', false],
            ['M-0035', 'Remy LeBeau', '+15045550135', '1999-01-16', '812 Bourbon St, New Orleans, LA 70116', '2022-06-26', 'inactive', false],
            ['M-0036', 'Kitty Pryde', '+18475550136', '1965-11-04', '64 Shadowcat Rd, Deerfield, IL 60015', '2018-12-25', 'active', false],
            ['M-0037', 'Sam Wilson', '+12025550137', '1972-08-06', '1964 Falcon Ave SE, Washington, DC 20003', '2018-11-11', 'active', false],
            ['M-0038', 'Bucky Barnes', '+17185550138', '1965-12-13', '4 Winter Soldier Way, Brooklyn, NY 11215', '2019-07-24', 'active', false],
            ['M-0039', 'Peter Quill', '+18165550139', '1965-12-06', '33 Star-Lord Dr, Kansas City, MO 64108', '2014-03-01', 'active', false],
            ['M-0040', 'Peter Parker', '+17185550140', '2011-06-15', '20 Ingram St, Forest Hills, NY 11375', '2024-11-05', 'active', false],
        ];

        foreach ($members as [$code, $name, $mobile, $birth, $address, $joined, $status, $delinquent]) {
            Member::query()->updateOrCreate(
                ['member_code' => $code],
                [
                    'name' => $name,
                    'mobile_number' => $mobile,
                    'birth_date' => $birth,
                    'address' => $address,
                    'membership_date' => $joined,
                    'status' => $status,
                    'is_delinquent' => $delinquent,
                ],
            );
        }
    }
}
