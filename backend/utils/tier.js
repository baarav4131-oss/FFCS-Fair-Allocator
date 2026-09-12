function computeTier(cgpa, attendance_pct) {
    if (cgpa >= 9) {
        return 1;
    } else if (attendance_pct === 100) {
        return 2;
    } else {
        return 3;
    }
}

module.exports = computeTier;