import nc from "next-connect";
import cors from "cors";
import axios from "axios";

const video_id = "27716306792649728";
const comentarios_url = `https://cos.tv/api/v2/feed/video/comment/list`;
const post_comentarios = {
    vid: `${video_id}`,
    order_by: "like_count",
    sort: "DESC",
    page: "1",
    pagesize: "999" //999
};

const handler = nc()
    .use(cors())
    .post(async (req, res) => {
        const response = await axios.post(comentarios_url, post_comentarios);
        res.json(response.data);
    });

export default handler;