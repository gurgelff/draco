// @ts-nocheck

import nc from "next-connect";
import cors from "cors";
import axios from "axios";


const handler = nc()
.use(cors())
.get(async (req, res) => {
        const inscritos_url =
        `https://cos.tv/api/v1/feed/video_user/others_fans_list?` +
        `fuid=${req.query.id}`
            + `&page=${req.query.pagina}`
            + `&pagesize=${req.query.quantidade_inscritos}`;
        const response = await axios.get(inscritos_url);
        res.json(response.data);
    });

export default handler;