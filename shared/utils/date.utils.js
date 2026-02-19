/**
 * Date Utilities Module
 * Provides comprehensive date manipulation and formatting functions
 */

class DateUtils {
    constructor() {
        this.formats = {
            ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
            DATE: 'YYYY-MM-DD',
            TIME: 'HH:mm:ss',
            DATETIME: 'YYYY-MM-DD HH:mm:ss',
            US: 'MM/DD/YYYY',
            EU: 'DD/MM/YYYY'
        };
    }

    /**
     * Get current date and time
     * @returns {Date} Current date object
     */
    getCurrentDate() {
        return new Date();
    }

    /**
     * Get current timestamp in milliseconds
     * @returns {number} Current timestamp
     */
    getCurrentTimestamp() {
        return Date.now();
    }

    /**
     * Get current timestamp in seconds
     * @returns {number} Current timestamp in seconds
     */
    getCurrentTimestampInSeconds() {
        return Math.floor(Date.now() / 1000);
    }

    /**
     * Format date to string
     * @param {Date} date - Date object to format
     * @param {string} format - Format string (YYYY, MM, DD, HH, mm, ss)
     * @returns {string} Formatted date string
     */
    formatDate(date, format = this.formats.DATETIME) {
        if (!(date instanceof Date)) return null;

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes)
            .replace('ss', seconds)
            .replace('SSS', milliseconds)
            .replace('Z', 'Z');
    }

    /**
     * Parse date string to Date object
     * @param {string} dateString - Date string to parse
     * @returns {Date} Parsed date object
     */
    parseDate(dateString) {
        return new Date(dateString);
    }

    /**
     * Add days to date
     * @param {Date} date - Base date
     * @param {number} days - Number of days to add
     * @returns {Date} New date with added days
     */
    addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    /**
     * Add months to date
     * @param {Date} date - Base date
     * @param {number} months - Number of months to add
     * @returns {Date} New date with added months
     */
    addMonths(date, months) {
        const result = new Date(date);
        result.setMonth(result.getMonth() + months);
        return result;
    }

    /**
     * Add years to date
     * @param {Date} date - Base date
     * @param {number} years - Number of years to add
     * @returns {Date} New date with added years
     */
    addYears(date, years) {
        const result = new Date(date);
        result.setFullYear(result.getFullYear() + years);
        return result;
    }

    /**
     * Add hours to date
     * @param {Date} date - Base date
     * @param {number} hours - Number of hours to add
     * @returns {Date} New date with added hours
     */
    addHours(date, hours) {
        const result = new Date(date);
        result.setHours(result.getHours() + hours);
        return result;
    }

    /**
     * Add minutes to date
     * @param {Date} date - Base date
     * @param {number} minutes - Number of minutes to add
     * @returns {Date} New date with added minutes
     */
    addMinutes(date, minutes) {
        const result = new Date(date);
        result.setMinutes(result.getMinutes() + minutes);
        return result;
    }

    /**
     * Add seconds to date
     * @param {Date} date - Base date
     * @param {number} seconds - Number of seconds to add
     * @returns {Date} New date with added seconds
     */
    addSeconds(date, seconds) {
        const result = new Date(date);
        result.setSeconds(result.getSeconds() + seconds);
        return result;
    }

    /**
     * Get difference between two dates in days
     * @param {Date} date1 - First date
     * @param {Date} date2 - Second date
     * @returns {number} Difference in days
     */
    getDaysDifference(date1, date2) {
        const oneDay = 24 * 60 * 60 * 1000;
        return Math.floor((date2 - date1) / oneDay);
    }

    /**
     * Get difference between two dates in hours
     * @param {Date} date1 - First date
     * @param {Date} date2 - Second date
     * @returns {number} Difference in hours
     */
    getHoursDifference(date1, date2) {
        const oneHour = 60 * 60 * 1000;
        return Math.floor((date2 - date1) / oneHour);
    }

    /**
     * Get difference between two dates in minutes
     * @param {Date} date1 - First date
     * @param {Date} date2 - Second date
     * @returns {number} Difference in minutes
     */
    getMinutesDifference(date1, date2) {
        const oneMinute = 60 * 1000;
        return Math.floor((date2 - date1) / oneMinute);
    }

    /**
     * Get difference between two dates in seconds
     * @param {Date} date1 - First date
     * @param {Date} date2 - Second date
     * @returns {number} Difference in seconds
     */
    getSecondsDifference(date1, date2) {
        return Math.floor((date2 - date1) / 1000);
    }

    /**
     * Check if date is in the past
     * @param {Date} date - Date to check
     * @returns {boolean} True if date is in the past
     */
    isDateInPast(date) {
        return date < new Date();
    }

    /**
     * Check if date is in the future
     * @param {Date} date - Date to check
     * @returns {boolean} True if date is in the future
     */
    isDateInFuture(date) {
        return date > new Date();
    }

    /**
     * Check if date is today
     * @param {Date} date - Date to check
     * @returns {boolean} True if date is today
     */
    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    /**
     * Check if date is tomorrow
     * @param {Date} date - Date to check
     * @returns {boolean} True if date is tomorrow
     */
    isTomorrow(date) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return date.getDate() === tomorrow.getDate() &&
               date.getMonth() === tomorrow.getMonth() &&
               date.getFullYear() === tomorrow.getFullYear();
    }

    /**
     * Check if date is yesterday
     * @param {Date} date - Date to check
     * @returns {boolean} True if date is yesterday
     */
    isYesterday(date) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return date.getDate() === yesterday.getDate() &&
               date.getMonth() === yesterday.getMonth() &&
               date.getFullYear() === yesterday.getFullYear();
    }

    /**
     * Check if year is leap year
     * @param {number} year - Year to check
     * @returns {boolean} True if year is leap year
     */
    isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    }

    /**
     * Get start of day
     * @param {Date} date - Base date
     * @returns {Date} Start of day (00:00:00)
     */
    getStartOfDay(date) {
        const result = new Date(date);
        result.setHours(0, 0, 0, 0);
        return result;
    }

    /**
     * Get end of day
     * @param {Date} date - Base date
     * @returns {Date} End of day (23:59:59)
     */
    getEndOfDay(date) {
        const result = new Date(date);
        result.setHours(23, 59, 59, 999);
        return result;
    }

    /**
     * Get start of month
     * @param {Date} date - Base date
     * @returns {Date} Start of month (first day, 00:00:00)
     */
    getStartOfMonth(date) {
        const result = new Date(date);
        result.setDate(1);
        result.setHours(0, 0, 0, 0);
        return result;
    }

    /**
     * Get end of month
     * @param {Date} date - Base date
     * @returns {Date} End of month (last day, 23:59:59)
     */
    getEndOfMonth(date) {
        const result = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        result.setHours(23, 59, 59, 999);
        return result;
    }

    /**
     * Get start of year
     * @param {Date} date - Base date
     * @returns {Date} Start of year (January 1, 00:00:00)
     */
    getStartOfYear(date) {
        const result = new Date(date);
        result.setMonth(0, 1);
        result.setHours(0, 0, 0, 0);
        return result;
    }

    /**
     * Get end of year
     * @param {Date} date - Base date
     * @returns {Date} End of year (December 31, 23:59:59)
     */
    getEndOfYear(date) {
        const result = new Date(date);
        result.setMonth(11, 31);
        result.setHours(23, 59, 59, 999);
        return result;
    }

    /**
     * Get day of week (0-6, where 0 is Sunday)
     * @param {Date} date - Base date
     * @returns {number} Day of week
     */
    getDayOfWeek(date) {
        return date.getDay();
    }

    /**
     * Get day of week name
     * @param {Date} date - Base date
     * @returns {string} Day name
     */
    getDayName(date) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[date.getDay()];
    }

    /**
     * Get month name
     * @param {Date} date - Base date
     * @returns {string} Month name
     */
    getMonthName(date) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
        return months[date.getMonth()];
    }

    /**
     * Get week number of year
     * @param {Date} date - Base date
     * @returns {number} Week number (1-53)
     */
    getWeekNumber(date) {
        const firstDay = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDay) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDay.getDay() + 1) / 7);
    }

    /**
     * Check if two dates are equal
     * @param {Date} date1 - First date
     * @param {Date} date2 - Second date
     * @returns {boolean} True if dates are equal
     */
    isEqual(date1, date2) {
        return date1.getTime() === date2.getTime();
    }

    /**
     * Check if date is between two dates
     * @param {Date} date - Date to check
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {boolean} True if date is between start and end
     */
    isBetween(date, startDate, endDate) {
        return date >= startDate && date <= endDate;
    }

    /**
     * Get days in month
     * @param {number} month - Month (1-12)
     * @param {number} year - Year
     * @returns {number} Number of days in month
     */
    getDaysInMonth(month, year) {
        return new Date(year, month, 0).getDate();
    }

    /**
     * Convert date to ISO string
     * @param {Date} date - Date to convert
     * @returns {string} ISO string
     */
    toISOString(date) {
        return date.toISOString();
    }

    /**
     * Get relative time (e.g., "2 hours ago", "in 3 days")
     * @param {Date} date - Date to compare
     * @returns {string} Relative time string
     */
    getRelativeTime(date) {
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
        if (seconds < 2592000) return `${Math.floor(seconds / 604800)} weeks ago`;
        if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months ago`;
        
        return `${Math.floor(seconds / 31536000)} years ago`;
    }

    /**
     * Clone a date
     * @param {Date} date - Date to clone
     * @returns {Date} Cloned date
     */
    cloneDate(date) {
        return new Date(date.getTime());
    }
}

// Export singleton instance
module.exports = new DateUtils();