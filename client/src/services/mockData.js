const MOCK_STUDENTS = [
    { id: 'S001', name: 'John Doe', campus: 'athi' },
    { id: 'S002', name: 'Jane Smith', campus: 'valley' },
    { id: 'S003', name: 'Alice Johnson', campus: 'athi' },
    { id: 'S004', name: 'Bob Brown', campus: 'valley' },
];

const MOCK_ATTENDANCE = [
    { id: 1, studentId: 'S001', date: '2023-10-23T20:45:00', campus: 'athi' },
    { id: 2, studentId: 'S002', date: '2023-10-23T20:50:00', campus: 'valley' },
];

export const getStudents = () => {
    return Promise.resolve(MOCK_STUDENTS);
}

export const getAttendanceStats = () => {
    // Return stats per campus
    return Promise.resolve({
        athi: { count: 15, trend: '+2' }, // Mocking dynamic numbers
        valley: { count: 12, trend: '-1' },
        total: 27
    });
}

export const submitAttendance = (studentName, campus) => {
    return new Promise((resolve, reject) => {
        // Mock API delay
        setTimeout(() => {
            if (!studentName) return reject('Name is required');
            resolve({ success: true, message: `Attendance marked for ${studentName} at ${campus} campus.` });
        }, 800);
    });
}
