// @ts-nocheck

import nc from "next-connect";
import cors from "cors";
import axios from "axios";

const handler = nc()
    .use(cors())
    .get(async (req: ReqGet, res) => {
        const like_url = `https://cos.tv/api/v1/feed/video/clapped_list`
            + `?uid=${req.query.id}`
            + `&page=1&pagesize=${req.query.quantidade_likes}`;
        const response = await axios.get(like_url);
        res.json(response.data);
    });

export default handler;