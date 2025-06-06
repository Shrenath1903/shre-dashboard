const express = require('express');
const bcrypt = require('bcrypt');
const path = require('path');
const db = require('./db'); // MySQL connection
const cors = require('cors');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(express.static('public')); // Serve static files like role.html, login.html

// 👉 REGISTER: Save user to DB
app.post('/register', async (req, res) => {
  const { username, password, role } = req.body;
  const hash = await bcrypt.hash(password, 10);
  db.query(
    'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
    [username, hash, role],
    err => {
      if (err) {
        console.error(err);
        return res.status(500).send('Registration error');
      }
      res.redirect('/login.html');
    }
  );
});

// 👉 LOGIN: Validate and return role + dashboards
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, users) => {
    if (err) return res.status(500).send('DB error');
    if (!users.length || !(await bcrypt.compare(password, users[0].password))) {
      return res.status(401).send('Invalid credentials');
    }

    const user = users[0];

    if (user.role === 'admin') {
      // For admin: fetch all dashboards
      db.query(`
        SELECT d.id, d.name, u.username, COUNT(s.id) AS sensorCount
        FROM dashboards d
        JOIN user_dashboards ud ON d.id = ud.dashboard_id
        JOIN users u ON u.id = ud.user_id
        LEFT JOIN sensor_data s ON s.dashboard_id = d.id
        GROUP BY d.id, d.name, u.username
      `,
      
      (err, dashboards) => {
        if (err) return res.status(500).send('Error fetching dashboards');
        // 👉 respond with admin role and dashboards
        res.json({ role: 'admin', dashboards, userId: user.id });
      });

    } else {
      // For user: fetch only their dashboards
      db.query(`
        SELECT d.* FROM dashboards d
        JOIN user_dashboards ud ON d.id = ud.dashboard_id
        WHERE ud.user_id = ?
      `, [user.id], (err, dashboards) => {
        if (err) return res.status(500).send('Error fetching user dashboards');
        res.json({ role: 'user', dashboards, userId: user.id });
      });
    }
  });
});

// 👉 SENSOR DATA FOR DASHBOARD (used in dash-1.html)
app.get('/dash-1/:userId', (req, res) => {
  const userId = req.params.userId;

  const query = `
    SELECT d.id as dashboardId, d.name AS dashboardName, s.type, s.value, s.timestamp, u.username
    FROM user_dashboards ud
    JOIN dashboards d ON ud.dashboard_id = d.id
    LEFT JOIN sensor_data s ON s.dashboard_id = d.id
    JOIN users u ON u.id = ud.user_id
    WHERE ud.user_id = ?
  `;

  db.query(query, [userId], (err, results) => {
    if (err) return res.status(500).send('Database error');
    res.json(results);
  });
});

// 👉 GET ALL DASHBOARDS + USERS (used by role.html)
app.get('/Roles', (req, res) => {

  const query = `
    SELECT id, username, role FROM users
  `;


//   const query = `
// SELECT d.id, d.name, u.username
// FROM dashboards d
// JOIN user_dashboards ud ON d.id = ud.dashboard_id
// JOIN users u ON u.id = ud.user_id
// GROUP BY d.id, d.name, u.username
//   `;
  // const query = `
  //   SELECT d.id, d.name, u.username, COUNT(s.id) AS sensorCount
  //   FROM dashboards d
  //   JOIN user_dashboards ud ON d.id = ud.dashboard_id
  //   JOIN users u ON u.id = ud.user_id
  //   LEFT JOIN sensor_data s ON s.dashboard_id = d.id
  //   GROUP BY d.id, d.name, u.username
  // `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching dashboards:', err);
      return res.status(500).send('Server error');
    }
      console.log('data:', results);

    res.json(results); // this should return array of dashboards
  });
});


// ✅ Start server
app.listen(3000, () => {
  console.log('✅ Server running at: http://localhost:3000/index.html');
});
