import nc from "next-connect";
import cors from "cors";
import axios from "axios";

const handler = nc()
    .use(cors())
    .get(async (req, res) => {
        const like_url = `https://cos.tv/api/v1/feed/video/clapped_list`
            + `?uid=${req.query.id}&page=1&pagesize=2`; //@TODO: size 99
        const response = await axios.get(like_url);
        res.json(response.data);
    });

export default handler;