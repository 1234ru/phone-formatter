<?php


namespace Freedom;


use Delivery\CDEK\Exception;

class PhoneFormatter
{
    /** @var string[] */
    public $patterns;

    /**
     * PhoneFormatter constructor.
     * See https://github.com/1234ru/phone-formatter
     * @param string[] $number_patterns
     * @throws \Exception
     */
    function __construct($number_patterns) {
        $this->patterns = static::validatePatterns($number_patterns);
    }

    private static function validatePatterns($all_patterns) {
        $valid_patterns = [];
        foreach ($all_patterns as $pattern) {
            if (static::isPatternStringValid($pattern)) {
                $valid_patterns[] = $pattern;
            } else {
                $msg = 'Invalid phone pattern "%s". '
                    . 'Only digits, spaces, "+", "-", "(", ")" and "N" are allowed' ;
                throw new \Exception( sprintf($msg, $pattern), E_USER_WARNING );
            }
        }
        return $valid_patterns;
    }

    private static function isPatternStringValid(string $pattern) :bool {
        return ! preg_match('/[^\d\s()+\-N]/', $pattern);
    }

    /** @throws \Exception */
    public function format(
        string $phone_raw,
        bool $throw_exception_on_failure = false,
        bool $length_strict_check = false
    ) :string {
        $phone_raw = trim($phone_raw);
        if (!$phone_raw) {
            return '';
        }
        $phone_formatted = '';
        foreach ($this->patterns as $pattern) {
            $phone_formatted = static::applyPattern(
                $phone_raw,
                $pattern,
                $length_strict_check
            );
            if ($phone_formatted) {
                break;
            }
        }
        if (!$phone_formatted) {
            if ($throw_exception_on_failure) {
                $msg = "Phone \"%s\" didn't match any of the patterns:\n"
                    . implode(",\n", $this->patterns) . "\n";
                throw new \Exception( sprintf($msg, $phone_raw) );
            }
            return $phone_raw;
        } else {
            return $phone_formatted;
        }
    }

    /**
     * Returns empty string if phone doesn't match the pattern.
     */
    private static function applyPattern(
        string $phone_raw,
        string $pattern,
        bool $length_strict_check = false
    ) :string {
        $phone_formatted = '';
        $pos_at_phone = 0;
        $pos_at_pattern = 0;
        while (
            ( $pattern_char = substr($pattern, $pos_at_pattern, 1) )
            &&
            ( $phone_char = substr($phone_raw, $pos_at_phone, 1) )
        ) {
            if ($pattern_char === $phone_char) {
                $pos_at_phone++;
                if ($phone_char !== 'N') {
                    // "N" may come from user input and should not be allowed
                    $phone_formatted .= $phone_char;
                    $pos_at_pattern++;
                }
            } elseif ( !is_numeric($phone_char) ) {
                // Not letting any invalid characters infiltrate into the result
                $pos_at_phone++;
            } elseif ($pattern_char === 'N') {
                $phone_formatted .= $phone_char;
                $pos_at_pattern++;
                $pos_at_phone++;
            } elseif ( !is_numeric($pattern_char) ) {
                $phone_formatted .= $pattern_char;
                $pos_at_pattern++;
            } else {
                // Ran into non-matching digits at the start -
                // pattern doesn't match, terminating execution.
                $phone_formatted = '';
                break;
            }
        }
        if ($phone_formatted && $length_strict_check) {
            if ($pos_at_pattern != mb_strlen($pattern)) {
                $phone_formatted = '';
            }
        }
        return $phone_formatted;
    }

    public function validate(string $phone) :bool {
        try {
            $this->format($phone, true, true);
            $valid = true;
        } catch (\Exception $e) {
            $valid = false;
        }
        return $valid;
    }

    public static function keepDigitsOnly(string $phone) :string {
        return preg_replace('/\D+/', '', $phone);
    }
}