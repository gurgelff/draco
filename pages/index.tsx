import { useState } from "react";

import axios from "axios";
import { Chance } from "chance";

import Head from "next/head";

export default function Home() {
  let usuarios_dados = [];

  const [usuarios, set_usuarios] = useState([]);
  const [sorteados_final, set_sorteados_final] = useState([]);
  const video_id = "27716306792649728";
  const email_regex = new RegExp(/^[a-z0-9.]+@[a-z0-9]+.[a-z]+.([a-z]+)?$/i);
  const asterisco_regex = new RegExp(/\*\*/);

  const get_inscritos = async () => await axios.get("api/get_subscribers");
  const get_comentarios = async () => await axios.post("api/post_comment");
  const get_likes = async (params) => await axios.get("api/get_like", params);
  const get_gift_votes = async () => await axios.get("api/get_vip");

  const checar_comentarios = () => {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          console.log("obtendo comentários...");
          const dados_comentarios = await get_comentarios();
          const lista_de_comentadores = dados_comentarios.data.data.list;

          for (const comentador of lista_de_comentadores) {
            let ja_existe = false;
            let indice = 0;

            for (let usuario of usuarios_dados) {
              if (comentador.uid == usuario.id) {
                ja_existe = true;
                indice = usuarios_dados.indexOf(usuario);
              }
            }

            if (!ja_existe) {
              const comentador_estruturado = {
                nome: comentador.user.nickname,
                conta: comentador.user.chain_account_name,
                id: comentador.uid,
                tickets: 0,
                segue: false,
                deu_like: false,
                comentou: true,
                nome_valido: false,
                mensagem: [],
              };
              usuarios_dados.push(comentador_estruturado);
            } else {
              usuarios_dados[indice].comentou = true;
            }
          }
          console.log("user comments ", usuarios_dados);
          resolve(usuarios_dados);
        } catch (error) {
          reject(error);
        }
      })();
    });
  };

  const checar_inscritos = () => {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          console.log("obtendo inscritos...");
          const dados_comentarios = await get_inscritos();
          const lista_de_inscritos = dados_comentarios.data.data.list;

          for (const inscrito of lista_de_inscritos) {
            let ja_existe = false;
            let indice = 0;

            for (let usuario of usuarios_dados) {
              if (inscrito.uid == usuario.id) {
                ja_existe = true;
                indice = usuarios_dados.indexOf(usuario);
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
              usuario_estruturado.mensagem.push("Não comentou. ");
              usuarios_dados.push(usuario_estruturado);
            } else {
              usuarios_dados[indice].segue = true;
            }
          }
          console.log("user subs ", usuarios_dados);
          resolve(usuarios_dados);
        } catch (error) {
          reject(error);
        }
      })();
    });
  };

  const checar_nomes = () => {
    return new Promise((resolve, reject) => {
      try {
        console.log("checando nomes...");

        for (const usuario of usuarios_dados) {
          const indice = usuarios_dados.indexOf(usuario);

          if (
            email_regex.test(usuario.nome) ||
            asterisco_regex.test(usuario.nome)
          ) {
            usuarios_dados[indice].nome_valido = false;
            usuarios_dados[indice].mensagem.push("Nome inválido. ");
          } else {
            usuarios_dados[indice].nome_valido = true;
          }
        }
        console.log("user names ", usuarios_dados);

        resolve(usuarios_dados);
      } catch (error) {
        reject(error);
      }
    });
  };

  const checar_likes = () => {
    console.log("likes, usuarios = ", usuarios_dados);

    return new Promise((resolve, reject) => {
      (async () => {
        try {
          for (const usuario of usuarios_dados) {
            const indice = usuarios_dados.indexOf(usuario);
            if (!usuario.comentou) {
              usuarios_dados[indice].mensagem
                .push("Like não apurado por não ter comentado.");
              continue;
            }

            console.log(
              `Apurando like de ${usuario.nome} ` +
                `| ${usuarios_dados.indexOf(usuario) + 1} de ${
                  usuarios_dados.length
                } `
            );

            if (!usuario.segue) {
              usuarios_dados[indice].mensagem.push("Não segue. ");
            }

            let deu_like = false;
            const resposta_like = await get_likes({
              params: {
                id: usuario.id,
              },
            });

            for (const video of resposta_like.data.data.list)
              if (String(video.id) == String(video_id)) {
                deu_like = true;
                break;
              }

            if (deu_like) {
              usuarios_dados[indice].deu_like = true;
            } else {
              usuarios_dados[indice].deu_like = false;
              usuarios_dados[indice].mensagem.push(
                "Não deu like nos últimos 100 vídeos. "
              );
            }
          }
          resolve(usuarios_dados);
        } catch (error) {
          reject(error);
        }
      })();
    });
  };

  const atribuir_tickets = () => {
    return new Promise((resolve, reject) => {
      try {
        console.log("atribuindo tickets...");
        for (const usuario of usuarios_dados) {
          const condicoes =
            usuario.segue &&
            usuario.deu_like &&
            usuario.comentou &&
            usuario.nome_valido;

          if (condicoes) {
            const indice = usuarios_dados.indexOf(usuario);
            usuarios_dados[indice].tickets = 1;
            usuarios_dados[indice].mensagem.push("Ok.");
          }
        }
        resolve(usuarios_dados);
      } catch (error) {
        reject(error);
      }
    });
  };

  const checar_vip = () => {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          console.log("checando gift votes...");
          const resposta_gift_votes = await get_gift_votes();

          for (const vip of resposta_gift_votes.data.data.reward_rank) {
            let ja_existe = false;
            let indice = 0;

            for (const usuario of usuarios_dados) {
              if (vip.uid == String(usuario.id)) {
                ja_existe = true;
                indice = usuarios_dados.indexOf(usuario);
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
                nome_valido: false,
                mensagem: [],
              };
              vip_estruturado.mensagem.push(
                "Fez doação mas" +
                  " não completou todas as tarefas." +
                  " Nenhum ticket adicionado. "
              );
              usuarios_dados.push(vip_estruturado);
            } else {
              const condicoes =
                usuarios_dados[indice].segue &&
                usuarios_dados[indice].deu_like &&
                usuarios_dados[indice].comentou &&
                usuarios_dados[indice].nome_valido;

              if (condicoes) {
                usuarios_dados[indice].tickets += parseInt(vip.score);
              } else {
                usuarios_dados[indice].mensagem.push(
                  "Fez doação mas" +
                    " não completou todas as tarefas." +
                    " Nenhum ticket adicionado. "
                );
              }
            }
          }
          resolve(usuarios_dados);
        } catch (error) {
          reject(error);
        }
      })();
    });
  };

  const executar_tudo = async () => {
    console.log("iniciando API");
    await checar_comentarios();
    await checar_inscritos();
    await checar_nomes();
    await checar_likes();
    await atribuir_tickets();
    await checar_vip();
    set_usuarios(usuarios_dados);
  };

  const mostrar_usuarios = () => {
    console.log("usuarios", usuarios);
  };

  const sortear = () => {
    const quantidade_de_sorteados = 20;
    let candidatos = [];
    let pesos = [];
    let sorteados = [];
    let candidatos_elegiveis = 0;

    const offline = false;

    if (offline) {
      // @TODO: lógica de pegar os dados a partir do arquivo
      console.log("offline");
    }

    for (const usuario of usuarios) {
      candidatos.push(usuario);
      pesos.push(usuario.tickets);

      if (usuario.tickets > 0) {
        candidatos_elegiveis += 1;
      }
    }

    const chance = Chance();

    if (quantidade_de_sorteados > candidatos_elegiveis) {
      alert("Número de sorteados é maior do que a lista de candidatos");
      throw Error("Valor muito alto");
    }

    while (true) {
      const sorteado = chance.weighted(candidatos, pesos);
      if (!sorteados.includes(sorteado)) sorteados.push(sorteado);
      if (sorteados.length >= quantidade_de_sorteados) break;
    }

    set_sorteados_final(sorteados);
  };

  return (
    <div>
      <Head>
        <title>Sorteador</title>
        <meta
          name="description"
          content="Sorteador | Utilitário para sorteios com peso"
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
        <h3>Todos os Candidatos:</h3>
        <div style={{ overflowY: "scroll", height: "20vh" }}>
          <br />
          {usuarios.map(
            (usuario) => (
              <div key={usuario.id}>
                <p>{`${usuario.nome}: ${usuario.mensagem}`}</p>
              </div>
            ),
            <br />
          )}
        </div>
        <button onClick={mostrar_usuarios}>mostrar usuarios</button>
        <button onClick={sortear}>sortear</button>
        <h3>Sorteados:</h3>
        <div style={{ overflowY: "scroll", height: "46vh" }}>
          <br />
          {sorteados_final.map((sorteado, indice) => (
            <div key={sorteado.id * indice}>
              <p>
                #
                {`${indice + 1} - ${sorteado.nome} | Tickets: ${
                  sorteado.tickets
                }`}
              </p>
              <br />
            </div>
          ))}
        </div>
      </main>

      <footer></footer>
    </div>
  );
}
