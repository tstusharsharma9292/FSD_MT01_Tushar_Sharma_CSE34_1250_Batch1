const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Handle malformed JSON payloads
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  next(err);
});

// In-memory student records (Set B - Student Record Management API)
let students = [
  {
    id: 201,
    rollNumber: 'CSE2401',
    name: 'Aarav Sharma',
    branch: 'CSE',
    semester: 3,
    email: 'aarav@example.com'
  },
  {
    id: 202,
    rollNumber: 'ECE2402',
    name: 'Diya Verma',
    branch: 'ECE',
    semester: 3,
    email: 'diya@example.com'
  },
  {
    id: 203,
    rollNumber: 'CSE2403',
    name: 'Kabir Singh',
    branch: 'CSE',
    semester: 3,
    email: 'kabir@example.com'
  }
];

let nextId = 204;

/**
 * Validate incoming student payload for POST and PUT requests.
 */
function validateStudent(body, excludeId = null) {
  const errors = [];

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, errors: ['Request body must be a JSON object'] };
  }

  const { rollNumber, name, branch, semester, email } = body;

  if (typeof rollNumber !== 'string' || rollNumber.trim().length === 0) {
    errors.push('rollNumber is required and must be a non-empty string');
  } else {
    const duplicate = students.some(
      (s) => s.id !== excludeId && s.rollNumber.toLowerCase() === rollNumber.trim().toLowerCase()
    );
    if (duplicate) {
      errors.push(`rollNumber '${rollNumber.trim()}' already exists`);
    }
  }

  if (typeof name !== 'string' || name.trim().length === 0) {
    errors.push('name is required and must be a non-empty string');
  }

  if (typeof branch !== 'string' || branch.trim().length === 0) {
    errors.push('branch is required and must be a non-empty string');
  }

  if (typeof semester !== 'number' || !Number.isInteger(semester) || semester < 1 || semester > 12) {
    errors.push('semester is required and must be an integer between 1 and 12');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (typeof email !== 'string' || !emailRegex.test(email.trim())) {
    errors.push('email is required and must be a valid email address');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      rollNumber: rollNumber.trim(),
      name: name.trim(),
      branch: branch.trim(),
      semester,
      email: email.trim()
    }
  };
}

// 1. GET all student records
app.get('/api/students', (req, res) => {
  res.status(200).json(students);
});

// 6. Filter student records by branch (declared before /:id)
app.get('/api/students/filter', (req, res) => {
  const { branch } = req.query;

  if (typeof branch !== 'string' || branch.trim().length === 0) {
    return res.status(400).json({ error: "Query parameter 'branch' is required" });
  }

  const target = branch.trim().toLowerCase();
  const filtered = students.filter((s) => s.branch.toLowerCase() === target);
  res.status(200).json(filtered);
});

// 3. GET student record by ID
app.get('/api/students/:id', (req, res) => {
  const id = Number(req.params.id);
  const student = Number.isInteger(id) ? students.find((s) => s.id === id) : null;

  if (!student) {
    return res.status(404).json({ error: `Student with id ${req.params.id} not found` });
  }

  res.status(200).json(student);
});

// 2. POST a new student record
app.post('/api/students', (req, res) => {
  const validation = validateStudent(req.body);

  if (!validation.valid) {
    return res.status(400).json({ error: 'Validation failed', details: validation.errors });
  }

  const newStudent = {
    id: nextId++,
    ...validation.data
  };

  students.push(newStudent);
  res.status(201).json(newStudent);
});

// 4. PUT / update a student record by ID
app.put('/api/students/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = Number.isInteger(id) ? students.findIndex((s) => s.id === id) : -1;

  if (index === -1) {
    return res.status(404).json({ error: `Student with id ${req.params.id} not found` });
  }

  const validation = validateStudent(req.body, id);

  if (!validation.valid) {
    return res.status(400).json({ error: 'Validation failed', details: validation.errors });
  }

  const updatedStudent = {
    id,
    ...validation.data
  };

  students[index] = updatedStudent;
  res.status(200).json(updatedStudent);
});

// 5. DELETE a student record by ID
app.delete('/api/students/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = Number.isInteger(id) ? students.findIndex((s) => s.id === id) : -1;

  if (index === -1) {
    return res.status(404).json({ error: `Student with id ${req.params.id} not found` });
  }

  const [deleted] = students.splice(index, 1);
  res.status(200).json({
    message: 'Student record deleted successfully',
    deleted
  });
});

app.listen(PORT, () => {
  console.log(`Student Record Management server running on http://localhost:${PORT}`);
});
