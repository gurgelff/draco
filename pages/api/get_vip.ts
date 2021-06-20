// @ts-nocheck

import nc from "next-connect";
import cors from "cors";
import axios from "axios";


const handler = nc()
.use(cors())
.get(async (req, res) => {
        const gift_votes_url =
            `https://cos.tv/api/v1/video/giftInfo?vid=${req.query.id}` +
            `&showRank=1&limit=99&lastSocre=`; //@TODO: limit 100
        const response = await axios.get(gift_votes_url);
        res.json(response.data);
    });

export default handler;