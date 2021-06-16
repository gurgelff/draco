import nc from "next-connect";
import cors from "cors";
import axios from "axios";

const video_id = "27716306792649728";
const gift_votes_url =
    `https://cos.tv/api/v1/video/giftInfo?vid=${video_id}` +
    `&showRank=1&limit=99&lastSocre=`; //@TODO: limit 100

const handler = nc()
    .use(cors())
    .get(async (req, res) => {
        const response = await axios.get(gift_votes_url);
        res.json(response.data);
    });

export default handler;