const express = require('express');
require('dotenv').config();
const cors = require('cors');
const app = express();
const axios = require('axios');
const PORT = process.env.port;
const supabase = require("./db.js");

app.use(express.json());
app.use(cors({ origin: "*" }));

app.listen(PORT, async () => {
    console.log(`Listening on port ${PORT}`);

    try {
        let serviceRegisterUrl = String(process.env.serviceRegistryUrl) + "/register";
    
        await axios.post(serviceRegisterUrl, {
          name: process.env.selfName,
          url: process.env.selfUrl,
        });
        console.log("Service registered successfully");
      } catch (error) {
        console.error("Failed to register service:", error);
        process.exit(1);
      }
});

app.get('/division', async (req, res) => {
    try {
        const board = await supabase.any(`select "name", "points", Rank() over (order by "points" desc) as rank
                                          from "Division"`); 
        res.status(200).json(board);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post('/district', async (req, res) => {
    try {
        const { division_id } = req.body;
        const board = await supabase.any(`select "name", "points", Rank() over (order by "points" desc) as rank
                                          from "District" where "divisionId" = $1`, [division_id]);
        res.status(200).json(board);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post('/upazilla', async (req, res) => {
    try {
        const { district_id } = req.body;
        const board = await supabase.any(`select "name", "points", Rank() over (order by "points" desc) as rank
                                          from "Upazilla" where "districtId" = $1`, [district_id]);
        res.status(200).json(board);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post('/union', async (req, res) => {
    try {
        const { upazilla_id } = req.body;
        const board = await supabase.any(`select "name", "points", Rank() over (order by "points" desc) as rank
                                          from "UnionParishad" where "upazillaId" = $1`, [upazilla_id]);
        res.status(200).json(board);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post('/farmer', async (req, res) => {
    try {
        const { union_id } = req.body;
        const board = await supabase.any(`select "name", "avatarLink", "points", Rank() over (order by "points" desc) as rank
                                          from "Farmer" as F, "User" as U  
                                          where F."id" = U."id"
                                          and U."unionId" = $1`, [union_id]);
        res.status(200).json(board);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post('/sme', async (req, res) => {
    try {
        const { union_id } = req.body;
        const board = await supabase.any(`select "name", "avatarLink", "points", Rank() over (order by "points" desc) as rank
                                          from "Sme" as S, "User" as U  
                                          where S."id" = U."id"
                                          and U."unionId" = $1`, [union_id]);
        res.status(200).json(board);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post('/vendor', async (req, res) => {
    try {
        const { union_id } = req.body;
        const board = await supabase.any(`select "name", "avatarLink", "points", Rank() over (order by "points" desc) as rank
                                          from "Vendor" as V, "User" as U  
                                          where V."id" = U."id"
                                          and U."unionId" = $1`, [union_id]);
        res.status(200).json(board);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post('/user-rank', async (req, res) => {
    try {
        const { user_id, account_type, union_id } = req.body;
        if(account_type == "farmer") {
            const self = await supabase.any(`select "name", "points", "rank" 
                                            from (select "name", F."id", "points", Rank() over (order by "points" desc) as rank
                                            from "Farmer" as F, "User" as U  
                                            where F."id" = U."id"
                                            and U."unionId" = $1) as P 
                                            where "id" = $2`, [union_id, user_id]);
            res.status(200).json(self);
        }
        else if(account_type == "sme") {
            const self = await supabase.any(`select "name", "points", "rank" 
                                            from (select "name", S."id", "points", Rank() over (order by "points" desc) as rank
                                            from "Sme" as S, "User" as U  
                                            where S."id" = U."id"
                                            and U."unionId" = $1) as P 
                                            where "id" = $2`, [union_id, user_id]);
            res.status(200).json(self);
        }
        else if(account_type == "vendor") {
            const self = await supabase.any(`select "name", "points", "rank" 
                                            from (select "name", V."id", "points", Rank() over (order by "points" desc) as rank
                                            from "Vendor" as V, "User" as U  
                                            where V."id" = U."id"
                                            and U."unionId" = $1) as P 
                                            where "id" = $2`, [union_id, user_id]);
            res.status(200).json(self);
        }
        else if(account_type == "agent") {
            const data = await supabase.any(`select "upazillaId" from "UnionParishad" where "agentId" = $1`, [user_id]);
            const upazilla_id = data[0].upazillaId;
            const self = await supabase.any(`select "name", "points", "rank" 
                                            from (select "name", "agentId", "points", Rank() over (order by "points" desc) as rank
                                            from "UnionParishad" where "upazillaId" = $1) as P 
                                            where "agentId" = $2`, [upazilla_id, user_id]);
            res.status(200).json(self);
        }
        else {
            res.status(400).json({ error: "Invalid account type" });
        }
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

const deregisterService = async () => {
    try {
      let serviceRegisterUrl =
        String(process.env.serviceRegistryUrl) + "/deregister";
      await axios.post(serviceRegisterUrl, { name: process.env.selfName });
      console.log("Service de-registered successfully");
    } catch (error) {
      console.log("Failed to de-register service:", error);
      process.exit(1);
    }
  };

const gracefulShutdown = async () => {
    await deregisterService();
    process.exit(0);
};

process.on('SIGTERM', gracefulShutdown); // For termination signal
process.on('SIGINT', gracefulShutdown); // For interrupt signal
process.on('uncaughtException', gracefulShutdown); // For uncaught exceptions