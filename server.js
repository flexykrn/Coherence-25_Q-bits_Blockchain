const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/login', (req, res) => {
    const { user, service } = req.body;
    
    // In a real application, you would verify the DID and public key here
    // For demo purposes, we'll just return success
    res.json({ success: true, message: `Logged in as ${user} for ${service}` });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 