import nc from "next-connect";
import cors from "cors";
import axios from "axios";

const canal_id = "26984287292531712";

const inscritos_url =
    `https://cos.tv/api/v1/feed/video_user/others_fans_list?` +
    `fuid=${canal_id}&page=1&pagesize=2`;

const handler = nc()
    .use(cors())
    .get(async (req, res) => {
        const response = await axios.get(inscritos_url);
        res.json(response.data);
    });

export default handler;