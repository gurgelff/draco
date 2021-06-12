import { Chance } from "chance";
import axios from "axios";

const Api = () => {
    console.log("iniciando API")
    let usuarios = []
    const video_id = 27716306792649728;
    const canal_id = 26984287292531712;
    const email_regex = new RegExp("/^[a-z0-9.]+@[a-z0-9]+\.[a-z]+\.([a-z]+)?$/i");

    const gift_votes_url = `https://cos.tv/api/v1/video/giftInfo?vid=${video_id}`
        + `&showRank=1&limit=100&lastSocre=`;

    const inscritos_url = `https://cos.tv/api/v1/feed/video_user/others_fans_list?`
        + `fuid=${canal_id}&page=1&pagesize=999`;

    const comentarios_url = `https://cos.tv/api/v2/feed/video/comment/list`;
    const post_comentarios = {
        vid: `${video_id}`,
        order_by: "like_count",
        sort: "DESC",
        page: 1,
        pagesize: 999
    }

    const get_gift_votes = (url: string) => axios.get(url);
    const get_inscritos = (url: string) => axios.get(url);
    const get_comentarios = (url: string, post) => axios.post(url, post);

    const checar_comentarios = (json) => {
        console.log("iniciando obtenção de comentários")

        for (const comentador in json.data.list) {
            let ja_existe = false;
            let indice = 0;

            for (let usuario in usuarios) {
                if (comentador["uid"] == usuario["id"]) {
                    ja_existe = true;
                    indice = usuarios.indexOf(usuario);
                }
            }

            if (!ja_existe) {
                const comentador_estruturado = {
                    nome: comentador["user"]["nickname"],
                    conta: comentador["user"]["chain_account_name"],
                    id: comentador["uid"],
                    tickets: 0,
                    segue: false,
                    deu_like: false,
                    comentou: true,
                    mensagem: []
                }
                usuarios.push(comentador_estruturado)

            }
            else {
                usuarios[indice]["comentou"] = true
            }
        }
    }

    checar_comentarios(get_comentarios);


}

export default Api;