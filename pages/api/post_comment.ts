// @ts-nocheck

import nc from "next-connect";
import cors from "cors";
import axios from "axios";

const comentarios_url = `https://cos.tv/api/v2/feed/video/comment/list`;

const handler = nc()
.use(cors())
.post(async (req, res) => {
        const post_comentarios = {
            vid: `${req.body.id}`,
            order_by: "like_count",
            sort: "DESC",
            page: "1",
            pagesize: req.body.quantidade_comentarios
        };
        const response = await axios.post(comentarios_url, post_comentarios);
        res.json(response.data);
    });

export default handler;