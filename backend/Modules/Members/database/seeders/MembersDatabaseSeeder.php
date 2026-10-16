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
            ['M-0001', 'Rodrigo Quiocho', '+639171007919', '1998-02-04', 'Brgy. Suyo, Batac City, Ilocos Norte', '2020-06-05', 'active', false],
            ['M-0002', 'Rowena Albano', '+639171015838', '1991-07-02', 'Brgy. Saud, Pagudpud, Ilocos Norte', '2018-10-26', 'active', false],
            ['M-0003', 'Jose Agbayani', '+639171023757', '1980-06-23', 'Brgy. Bani, Paoay, Ilocos Norte', '2018-08-03', 'active', false],
            ['M-0004', 'Gloria Tabije', '+639171031676', '1965-05-16', 'Brgy. Mira, Bangui, Ilocos Norte', '2014-12-23', 'active', false],
            ['M-0005', 'Emilio Corpuz', '+639171039595', '1979-11-19', 'Brgy. Pagburnayan, Vigan City, Ilocos Sur', '2019-07-22', 'active', false],
            ['M-0006', 'Rosario Reyes', '+639171047514', '1982-01-15', 'Brgy. Paratong, Candon City, Ilocos Sur', '2014-08-02', 'active', false],
            ['M-0007', 'Alfredo Pascual', '+639171055433', '1973-05-05', 'Brgy. Sinabaan, Narvacan, Ilocos Sur', '2017-08-03', 'active', false],
            ['M-0008', 'Rosario Agbayani', '+639171063352', '1970-08-13', 'Brgy. Poblacion, Santa Maria, Ilocos Sur', '2020-07-28', 'active', false],
            ['M-0009', 'Leonardo Baniaga', '+639171071271', '1995-05-23', 'Brgy. Tamurong, Santiago, Ilocos Sur', '2018-06-22', 'inactive', false],
            ['M-0010', 'Teresita Villanueva', '+639171079190', '1984-04-05', 'Brgy. Gabu, Laoag City, Ilocos Norte', '2015-11-08', 'active', false],
            ['M-0011', 'Antonio Ragasa', '+639171087109', '1960-08-27', 'Brgy. Suyo, Batac City, Ilocos Norte', '2016-01-05', 'active', false],
            ['M-0012', 'Marites Ramos', '+639171095028', '1986-09-12', 'Brgy. Saud, Pagudpud, Ilocos Norte', '2015-12-28', 'active', false],
            ['M-0013', 'Cesar Tabije', '+639171102947', '1992-10-21', 'Brgy. Bani, Paoay, Ilocos Norte', '2022-12-02', 'active', true],
            ['M-0014', 'Josefina Albano', '+639171110866', '1989-11-26', 'Brgy. Mira, Bangui, Ilocos Norte', '2020-07-13', 'active', false],
            ['M-0015', 'Cesar Ramos', '+639171118785', '1985-07-04', 'Brgy. Pagburnayan, Vigan City, Ilocos Sur', '2019-11-13', 'active', false],
            ['M-0016', 'Cecilia Corpuz', '+639171126704', '1963-04-03', 'Brgy. Paratong, Candon City, Ilocos Sur', '2015-08-06', 'active', false],
            ['M-0017', 'Ernesto Ramos', '+639171134623', '1967-06-20', 'Brgy. Sinabaan, Narvacan, Ilocos Sur', '2012-02-01', 'active', false],
            ['M-0018', 'Josefina Ramos', '+639171142542', '1996-03-18', 'Brgy. Poblacion, Santa Maria, Ilocos Sur', '2013-06-20', 'active', false],
            ['M-0019', 'Benjamin Soriano', '+639171150461', '1961-02-28', 'Brgy. Tamurong, Santiago, Ilocos Sur', '2015-10-13', 'active', false],
            ['M-0020', 'Imelda Domingo', '+639171158380', '1969-11-09', 'Brgy. Gabu, Laoag City, Ilocos Norte', '2017-10-12', 'active', false],
            ['M-0021', 'Leonardo Quiocho', '+639171166299', '1990-02-04', 'Brgy. Suyo, Batac City, Ilocos Norte', '2019-08-16', 'inactive', false],
            ['M-0022', 'Cecilia Domingo', '+639171174218', '1990-05-03', 'Brgy. Saud, Pagudpud, Ilocos Norte', '2014-02-24', 'active', false],
            ['M-0023', 'Benjamin Guerrero', '+639171182137', '1981-12-09', 'Brgy. Bani, Paoay, Ilocos Norte', '2019-12-06', 'active', false],
            ['M-0024', 'Luzviminda Tabije', '+639171190056', '1993-01-07', 'Brgy. Mira, Bangui, Ilocos Norte', '2020-06-05', 'active', false],
            ['M-0025', 'Cesar Corpuz', '+639171197975', '1994-01-25', 'Brgy. Pagburnayan, Vigan City, Ilocos Sur', '2020-05-21', 'active', false],
            ['M-0026', 'Remedios Gaoat', '+639171205894', '1965-12-28', 'Brgy. Paratong, Candon City, Ilocos Sur', '2016-09-12', 'active', false],
            ['M-0027', 'Ramon Ragasa', '+639171213813', '1970-06-25', 'Brgy. Sinabaan, Narvacan, Ilocos Sur', '2015-09-18', 'active', true],
            ['M-0028', 'Teresita Corpuz', '+639171221732', '1992-06-21', 'Brgy. Poblacion, Santa Maria, Ilocos Sur', '2015-10-26', 'active', false],
            ['M-0029', 'Jose Bautista', '+639171229651', '1972-04-27', 'Brgy. Tamurong, Santiago, Ilocos Sur', '2018-12-26', 'active', false],
            ['M-0030', 'Remedios Cabuang', '+639171237570', '1974-04-17', 'Brgy. Gabu, Laoag City, Ilocos Norte', '2019-06-24', 'active', false],
            ['M-0031', 'Benjamin Baniaga', '+639171245489', '1961-01-26', 'Brgy. Suyo, Batac City, Ilocos Norte', '2016-08-09', 'active', false],
            ['M-0032', 'Milagros Sagun', '+639171253408', '1972-12-20', 'Brgy. Saud, Pagudpud, Ilocos Norte', '2017-08-26', 'active', false],
            ['M-0033', 'Cesar Reyes', '+639171261327', '1982-06-03', 'Brgy. Bani, Paoay, Ilocos Norte', '2015-02-08', 'active', false],
            ['M-0034', 'Jocelyn Gaoat', '+639171269246', '1990-04-11', 'Brgy. Mira, Bangui, Ilocos Norte', '2015-08-20', 'active', false],
            ['M-0035', 'Carlos Villanueva', '+639171277165', '1999-01-16', 'Brgy. Pagburnayan, Vigan City, Ilocos Sur', '2022-06-26', 'inactive', false],
            ['M-0036', 'Luzviminda Querubin', '+639171285084', '1965-11-04', 'Brgy. Paratong, Candon City, Ilocos Sur', '2018-12-25', 'active', false],
            ['M-0037', 'Roberto Agbayani', '+639171293003', '1972-08-06', 'Brgy. Sinabaan, Narvacan, Ilocos Sur', '2018-11-11', 'active', false],
            ['M-0038', 'Divina Cabuang', '+639171300922', '1965-12-13', 'Brgy. Poblacion, Santa Maria, Ilocos Sur', '2019-07-24', 'active', false],
            ['M-0039', 'Rodrigo Salvador', '+639171308841', '1965-12-06', 'Brgy. Tamurong, Santiago, Ilocos Sur', '2014-03-01', 'active', false],
            ['M-0040', 'Jocelyn Domingo', '+639171316760', '2011-06-15', 'Brgy. Gabu, Laoag City, Ilocos Norte', '2024-11-05', 'active', false],
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
