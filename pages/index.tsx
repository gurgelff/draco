import { useState } from "react";

import axios from "axios";
import { Chance } from "chance";

import Head from "next/head";

export default function Home() {
  console.log("iniciando API");
  const [usuarios, set_usuarios] = useState([]);
  const video_id = "27716306792649728";
  const email_regex = new RegExp(/^[a-z0-9.]+@[a-z0-9]+.[a-z]+.([a-z]+)?$/i);
  const asterisco_regex = new RegExp(/\*\*/);

  const get_inscritos = async () => await axios.get("api/get_subscribers");
  const get_comentarios = async () => await axios.post("api/post_comment");
  const get_likes = async (params) => await axios.get("api/get_like", params);
  const get_gift_votes = async () => await axios.get("api/get_vip");

  const checar_comentarios = async () => {
    console.log("obtendo comentários...");
    const dados_comentarios = await get_comentarios();
    const lista_de_comentadores = dados_comentarios.data.data.list;

    for (const comentador of lista_de_comentadores) {
      let ja_existe = false;
      let indice = 0;

      for (let usuario of usuarios) {
        if (comentador.uid == usuario.id) {
          ja_existe = true;
          indice = usuarios.indexOf(usuario);
        }
      }

      if (!ja_existe) {
        const comentador_estruturado = {
          nome: comentador.user.nickname,
          conta: comentador.user.chain_aacount_name,
          id: comentador.uid,
          tickets: 0,
          segue: false,
          deu_like: false,
          comentou: true,
          nome_valido: false,
          mensagem: [],
        };
        set_usuarios((old_usuarios) => [
          ...old_usuarios,
          comentador_estruturado,
        ]);
      } else {
        let usuarios_tmp = [...usuarios];
        usuarios_tmp[indice].comentou = true;
        set_usuarios(usuarios_tmp);

      }
    }
  };

  const checar_inscritos = async () => {
    console.log("obtendo inscritos...");
    const dados_comentarios = await get_inscritos();
    const lista_de_inscritos = dados_comentarios.data.data.list;

    for (const inscrito of lista_de_inscritos) {
      let ja_existe = false;
      let indice = 0;

      for (let usuario of usuarios) {
        if (inscrito.uid == usuario.id) {
          ja_existe = true;
          indice = usuarios.indexOf(usuario);
        }
      }

      if (!ja_existe) {
        let usuario_estruturado = {
          nome: inscrito.nickname,
          conta: "",
          id: inscrito.uid,
          tickets: 0,
          segue: true,
          deu_like: false,
          comentou: false,
          nome_valido: false,
          mensagem: [],
        };
        usuario_estruturado.mensagem.push("Não comentou");
        set_usuarios((old_usuarios) => [...old_usuarios, usuario_estruturado]);
      } else {
        let usuarios_tmp = [...usuarios];
        usuarios_tmp[indice].segue = true;
        set_usuarios(usuarios_tmp);
      }
    }
  };

  const checar_nomes = () => {
    console.log("checando nomes...");
    console.log(usuarios);

    for (const usuario of usuarios) {
      let usuarios_tmp = [...usuarios];
      const indice = usuarios.indexOf(usuario);
      
      if (
        email_regex.test(usuario.nome) ||
        asterisco_regex.test(usuario.nome)
      ) {
        usuarios_tmp[indice].nome_valido = false;
        usuarios_tmp[indice].mensagem.push("Nome inválido");
        set_usuarios(usuarios_tmp);
      } else {
        usuarios_tmp[indice].nome_valido = true;
        set_usuarios(usuarios_tmp);
      }
    }
  };

  const checar_likes = async () => {
    for (const usuario of usuarios) {
      const usuarios_tmp = usuarios;
      const indice = usuarios.indexOf(usuario);

      console.log(
        `Apurando like de ${usuario.nome} ` +
          `| ${usuarios.indexOf(usuario) + 1} de ${usuarios.length} `
      );

      if (!usuario.segue) {
        usuarios_tmp[indice].mensagem.push("Não segue");
      }

      let deu_like = false;
      const resposta_like = await get_likes({
        params: {
          id: usuario.id,
        },
      });
      console.log("------------------------------", resposta_like);

      for (const video of resposta_like.data.data.list)
        if (String(video.id) == String(video_id)) {
          deu_like = true;
          break;
        }

      if (deu_like) {
        usuarios_tmp[indice].deu_like = true;
      } else {
        usuarios_tmp[indice].deu_like = false;
        usuarios_tmp[indice].mensagem.push("Não deu like nos últimos 100 vídeos.");
      }
      set_usuarios(usuarios_tmp);
    }
  };

  const atribuir_tickets = () => {
    for (const usuario of usuarios) {
      const condicoes =
        usuario.segue &&
        usuario.deu_like &&
        usuario.comentou &&
        usuario.nome_valido;

      if (condicoes) usuario.tickets = 1;
    }
  };

  const checar_vip = async () => {
    const resposta_gift_votes = await get_gift_votes();

    for (const vip of resposta_gift_votes.data.data.reward_rank) {
      let ja_existe = false;
      let indice = 0;

      for (const usuario of usuarios) {
        if (vip.uid == String(usuario.id)) {
          ja_existe = true;
          indice = usuarios.indexOf(usuario);
        }
      }

      if (!ja_existe) {
        let vip_estruturado = {
          nome: vip.nickname,
          id: vip.uid,
          tickets: 0,
          segue: false,
          deu_like: false,
          comentou: false,
          mensagem: [],
        };
        vip_estruturado.mensagem.push(
          "Fez doação mas" +
            " não completou todas as tarefas." +
            " Nenhum ticket adicionado."
        );
        set_usuarios(old_usuarios => [...old_usuarios, vip_estruturado]);
      } else {
        const condicoes =
          usuarios[indice].segue &&
          usuarios[indice].deu_like &&
          usuarios[indice].comentou &&
          usuarios[indice].nome_valido;

        if (condicoes) {
          let usuarios_tmp = [...usuarios];
          usuarios_tmp[indice].tickets += parseInt(vip.score);
          set_usuarios(usuarios_tmp);
        } else {
          let usuarios_tmp = [...usuarios];
          usuarios_tmp[indice].mensagem.push(
            "Fez doação mas" +
              " não completou todas as tarefas." +
              " Nenhum ticket adicionado."
          );
          set_usuarios(usuarios_tmp);          
        }
      }
    }
  };

  

  const executar_tudo = () => {
    checar_comentarios();
    checar_inscritos();
    checar_nomes();
    checar_likes();
    atribuir_tickets();
    checar_vip();

  }

  console.log("*******usuarios*******", usuarios);

  return (
    <div>
      <Head>
        <title>Sorteador</title>
        <meta
          name="Sorteador com peso"
          content="Utilitário para sorteios com peso"
        />
        <link
          about="icon from freepik and flaticon"
          rel="icon"
          href="/luck.svg"
        />
      </Head>

      <main>
        <h1>Sorteador</h1>
        <button onClick={executar_tudo}>executar tudo</button>
        <p>{usuarios.map((usuario) => usuario.nome + ", " )}</p>
      </main>

      <footer></footer>
    </div>
  );
}
