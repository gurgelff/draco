// @ts-nocheck

import React, { useRef, useState } from "react";

import axios from "axios";
import { Chance } from "chance";
import download from "js-file-download";
import {
  Container,
  Button,
  Navbar,
  ListGroup,
  Form,
  ProgressBar,
  InputGroup,
  FormControl,
  Collapse,
  Accordion,
  Card,
  Spinner,
} from "react-bootstrap";

import Head from "next/head";

export default function Home() {
  let usuarios_dados = [];
  let total_comentaristas = 0;

  const [usuarios, set_usuarios] = useState([]);
  const [sorteados_final, set_sorteados_final] = useState([]);
  const [arquivo_local, set_arquivo_local] = useState({});
  const [log, set_log] = useState("");
  const [status_progresso, set_status_progresso] = useState(0);
  const [modo, set_modo] = useState("");
  const [input_sorteados, set_input_sorteados] = useState(3);
  const [input_video_id, set_input_video_id] = useState("27716306792649728");
  const [input_canal_id, set_input_canal_id] = useState("26984287292531712");

  const video_id = "27716306792649728";
  const email_regex = new RegExp(/^[a-z0-9.]+@[a-z0-9]+.[a-z]+.([a-z]+)?$/i);
  const asterisco_regex = new RegExp(/\*\*/);

  const cor_primaria = "#1E6F5C";
  const cor_secundaria = "#289672";
  const cor_terciaria = "#29BB89";

  const input_escondido = useRef(null);
  const accordion_ref = useRef(null);

  const get_inscritos = async (params) =>
    await axios.get("api/get_subscribers", params);

  const get_comentarios = async (params) =>
    await axios.post("api/post_comment", params);

  const get_likes = async (params) => await axios.get("api/get_like", params);

  const get_gift_votes = async (params) =>
    await axios.get("api/get_vip", params);

  const checar_comentarios = () => {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          set_log("Obtendo comentários ");

          const dados_comentarios = await get_comentarios({
            id: input_video_id,
          });

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
              total_comentaristas += 1;
            } else {
              usuarios_dados[indice].comentou = true;
            }
          }
          set_log;
          ("Finalizada a obtenção de comentários");
          resolve(usuarios_dados);
        } catch (error) {
          set_log(`Erro ao obter comentários: ${error}`);
          reject(error);
        }
      })();
    });
  };

  const checar_inscritos = () => {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          set_log("Obtendo inscritos ");

          const dados_inscritos = await get_inscritos({
            params: {
              id: input_canal_id,
            },
          });

          const lista_de_inscritos = dados_inscritos.data.data.list;

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
              usuario_estruturado.mensagem.push(" Não comentou");
              usuarios_dados.push(usuario_estruturado);
            } else {
              usuarios_dados[indice].segue = true;
            }
          }
          set_log("Finalizada a obtenção de inscritos");
          resolve(usuarios_dados);
        } catch (error) {
          set_log(`Erro ao obter inscritos: ${error}`);
          reject(error);
        }
      })();
    });
  };

  const checar_nomes = () => {
    return new Promise((resolve, reject) => {
      try {
        set_log("Checando nomes ");

        for (const usuario of usuarios_dados) {
          const indice = usuarios_dados.indexOf(usuario);

          if (
            email_regex.test(usuario.nome) ||
            asterisco_regex.test(usuario.nome)
          ) {
            usuarios_dados[indice].nome_valido = false;
            usuarios_dados[indice].mensagem.push(" Nome inválido");
          } else {
            usuarios_dados[indice].nome_valido = true;
          }
        }

        resolve(usuarios_dados);
      } catch (error) {
        set_log(`Erro ao checar nomes: ${error}`);
        reject(error);
      }
    });
  };

  const checar_likes = () => {
    set_log("Checando Likes ");

    return new Promise((resolve, reject) => {
      (async () => {
        try {
          for (const usuario of usuarios_dados) {
            const indice = usuarios_dados.indexOf(usuario);
            if (!usuario.comentou) {
              usuarios_dados[indice].mensagem.push(
                " Like não apurado por não ter comentado"
              );
              continue;
            }

            set_status_progresso(
              (usuarios_dados.indexOf(usuario) + 1) / total_comentaristas
            );

            if (!usuario.segue) {
              usuarios_dados[indice].mensagem.push(" Não segue");
            }

            let deu_like = false;
            const resposta_like = await get_likes({
              params: {
                id: usuario.id,
              },
            });

            for (const video of resposta_like.data.data.list)
              if (String(video.id) == input_video_id) {
                deu_like = true;
                break;
              }

            if (deu_like) {
              usuarios_dados[indice].deu_like = true;
            } else {
              usuarios_dados[indice].deu_like = false;
              usuarios_dados[indice].mensagem.push(
                " Não deu like nos últimos 100 vídeos"
              );
            }
          }
          set_status_progresso(0);
          set_log("Finalizada a obtenção de likes.");
          resolve(usuarios_dados);
        } catch (error) {
          set_log(`Erro ao obter likes: ${error}`);
          reject(error);
        }
      })();
    });
  };

  const atribuir_tickets = () => {
    return new Promise((resolve, reject) => {
      try {
        set_log("Atribuindo tickets ");
        for (const usuario of usuarios_dados) {
          const condicoes =
            usuario.segue &&
            usuario.deu_like &&
            usuario.comentou &&
            usuario.nome_valido;

          if (condicoes) {
            const indice = usuarios_dados.indexOf(usuario);
            usuarios_dados[indice].tickets = 1;
            usuarios_dados[indice].mensagem.push(" Ok");
          }
        }
        resolve(usuarios_dados);
        set_log("Finalizada a atribuição de tickets");
      } catch (error) {
        set_log(`Erro ao atribuir tickets: ${error}`);
        reject(error);
      }
    });
  };

  const checar_vip = () => {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          set_log("Checando gift votes ");

          const resposta_gift_votes = await get_gift_votes({
            params: {
              id: input_video_id,
            },
          });

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
                " Fez doação mas" +
                  " não completou todas as tarefas." +
                  " Nenhum ticket adicionado"
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
                  " Fez doação mas" +
                    " não completou todas as tarefas." +
                    " Nenhum ticket adicionado"
                );
              }
            }
          }
          resolve(usuarios_dados);
        } catch (error) {
          set_log(`Erro ao checar gift votes: ${error}`);
          reject(error);
        }
      })();
    });
  };

  const executar_tudo = async () => {
    set_modo("API");
    set_log("Iniciando tarefas ");
    await checar_comentarios();
    await checar_inscritos();
    await checar_nomes();
    await checar_likes();
    await atribuir_tickets();
    await checar_vip();
    set_usuarios(usuarios_dados);
    usuarios_dados = [];
    total_comentaristas = 0;
    set_log("");
  };

  const arquivo_para_json = async (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = (event) => resolve(JSON.parse(event.target.result));
      fileReader.onerror = (error) => reject(error);
      fileReader.readAsText(file);
    });
  };

  const sortear = () => {
    const quantidade_de_sorteados = input_sorteados;
    let candidatos = [];
    let lista_de_usuarios;
    let pesos = [];
    let sorteados = [];
    let candidatos_elegiveis = 0;

    if (modo == "local") {
      lista_de_usuarios = arquivo_local;
    } else {
      lista_de_usuarios = usuarios;
    }

    for (const usuario of lista_de_usuarios) {
      candidatos.push(usuario);
      pesos.push(usuario.tickets);

      if (usuario.tickets > 0) {
        candidatos_elegiveis += 1;
      }
    }

    const chance = Chance();

    if (quantidade_de_sorteados > candidatos_elegiveis) {
      alert("Número de sorteados é maior do que a lista de candidatos!");
    } else {
      while (true) {
        const sorteado = chance.weighted(candidatos, pesos);
        if (!sorteados.includes(sorteado)) sorteados.push(sorteado);
        if (sorteados.length >= quantidade_de_sorteados) break;
      }
    }

    set_sorteados_final(sorteados);
    sorteados = [];
  };

  const lidar_com_clique = (event) => {
    set_modo("local");
    input_escondido.current.click();
  };

  const lidar_com_mudanca = async (event) => {
    const arquivo = await arquivo_para_json(event.target.files[0]);
    set_arquivo_local(arquivo);
    set_usuarios(arquivo);
  };

  const baixar_arquivo = () => {
    download(JSON.stringify(usuarios, null, 4), "candidatos.json");
  };
  //       opções avançadas: lite: qtd likes, comentarios, etc...

  return (
    <div
      style={{
        background: cor_primaria,
      }}
    >
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
        <Navbar id="logo" bg="dark" variant="dark">
          <Navbar.Brand href="#home">
            <img
              alt=""
              src="/luck.svg"
              width="30"
              height="30"
              className="d-inline-block align-top"
            />
            Sorteador
          </Navbar.Brand>
        </Navbar>

        <Container fluid>
          <h4>Sorteador COS.TV</h4>

          <div>
            <Accordion defaultActiveKey="0">
              <Card id="colapso">
                <Card.Header id="colapso">
                  <Accordion.Toggle
                    as={"span"}
                    eventKey="1"
                    ref={accordion_ref}
                  >
                    <span
                      id="span-accordion"
                      style={{
                        background: cor_terciaria,
                        borderColor: cor_terciaria,
                        padding: "10px",
                        border: "1px solid #00ffc3",
                        borderRadius: "1.2vh",
                      }}
                    >
                      Preencha as informações
                    </span>
                  </Accordion.Toggle>
                </Card.Header>
                <Accordion.Collapse eventKey="1">
                  <Card.Body id="colapso" style={{ paddingTop: 0 }}>
                    <label>ID do vídeo</label>
                    <input
                      type="text"
                      name="quantity"
                      value={input_video_id}
                      onInput={(event) =>
                        set_input_video_id(String(event.target.value))
                      }
                      style={{ color: "black" }}
                    />
                    <label>ID do Canal</label>
                    <input
                      type="text"
                      name="quantity"
                      value={input_canal_id}
                      onInput={(event) =>
                        set_input_canal_id(String(event.target.value))
                      }
                      style={{ color: "black" }}
                    />
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        marginTop: "10px",
                      }}
                    >
                      <Button
                        style={{
                          background: cor_terciaria,
                          borderColor: cor_terciaria,
                          marginRight: "10px",
                        }}
                        onClick={() => {
                          accordion_ref.current.click();
                          executar_tudo();
                        }}
                      >
                        Importar Novos Dados
                      </Button>
                      <Form>
                        <Form.Group>
                          <Form.File
                            style={{ display: "none" }}
                            id="arquivo_json"
                            ref={input_escondido}
                            label="Enviar arquivo local"
                            onChange={lidar_com_mudanca}
                          />
                        </Form.Group>
                      </Form>
                      <Button
                        style={{
                          background: cor_terciaria,
                          borderColor: cor_terciaria,
                        }}
                        onClick={lidar_com_clique}
                      >
                        Enviar Arquivo Local
                      </Button>
                    </div>
                  </Card.Body>
                </Accordion.Collapse>
              </Card>
            </Accordion>
            <div id="centralizar">
              {usuarios[0] ? (
                <>
                  <h5>Todos os Candidatos:</h5>
                  <div
                    style={{
                      height: "20vh",
                      overflowY: "scroll",
                      color: "white",
                      border: `2px solid ${cor_terciaria}`,
                      scrollbarWidth: "none",
                    }}
                    id="candidatos"
                  >
                    <ListGroup>
                      {usuarios.map((usuario) => (
                        <ListGroup.Item
                          key={usuario.id}
                          style={{ background: cor_secundaria, color: "white" }}
                        >
                          <>
                            {""}
                            <Accordion defaultActiveKey="0">
                              <Card id="transparente">
                                <Card.Header id="transparente">
                                  <Accordion.Toggle as={"span"} eventKey="1">
                                    <span id="nome"> {`${usuario.nome}`} </span>
                                  </Accordion.Toggle>
                                </Card.Header>
                                <Accordion.Collapse eventKey="1">
                                  <Card.Body id="transparente">
                                    {`${usuario.mensagem
                                      .join(",")
                                      .replace(/,/g, ", ")}`}
                                  </Card.Body>
                                </Accordion.Collapse>
                              </Card>
                            </Accordion>
                          </>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </div>
                  <div id="quantidade_sorteados">
                    <label>Quantidade de Sorteados</label>
                    <input
                      type="number"
                      name="quantity"
                      value={input_sorteados}
                      onInput={(event) =>
                        set_input_sorteados(parseInt(event.target.value))
                      }
                      min={1}
                      style={{ color: "black" }}
                    />
                  </div>

                  <div id="botao-sortear">
                    <Button
                      style={{
                        background: cor_terciaria,
                        borderColor: cor_terciaria,
                        marginTop: "10px",
                      }}
                      onClick={sortear}
                    >
                      Sortear
                    </Button>
                    <Button
                      style={{
                        background: cor_terciaria,
                        borderColor: cor_terciaria,
                        marginTop: "10px",
                        marginLeft: "10px",
                      }}
                      onClick={baixar_arquivo}
                    >
                      Baixar Arquivo
                    </Button>
                  </div>
                </>
              ) : null}

              {log ? (
                <>
                  <p style={{ marginTop: "10px", display: "inline" }}>
                    {log}
                    {""}
                  </p>
                  {""}
                  {status_progresso > 0 ? (
                    <ProgressBar
                      id="barra"
                      animated
                      now={status_progresso * 100}
                    />
                  ) : (
                    <Spinner
                      style={{
                        marginLeft: "7px",
                        marginTop: "10px",
                        width: "25px",
                        height: "25px",
                        color: cor_terciaria,
                      }}
                      animation="border"
                      as="span"
                    />
                  )}
                </>
              ) : null}
            </div>
          </div>
        </Container>
        {sorteados_final[0] ? (
          <Container fluid>
            <h5>Sorteados:</h5>
            <div
              style={{
                overflowY: "scroll",
                height: "30vh",
                border: `2px solid ${cor_terciaria}`,
                scrollbarWidth: "none",
              }}
              id="sorteados"
            >
              {sorteados_final.map((sorteado, indice) => (
                <div key={sorteado.id * indice}>
                  <ListGroup>
                    <ListGroup.Item
                      key={sorteado.id * indice * indice}
                      style={{ background: cor_secundaria, color: "white" }}
                    >
                      <Accordion defaultActiveKey="0">
                        <Card id="transparente">
                          <Card.Header id="transparente">
                            <Accordion.Toggle as={"span"} eventKey="1">
                              <span id="posicao">{`#${indice + 1}`}</span>{" "}
                              <span id="nome">{`${sorteado.nome}`}</span>
                            </Accordion.Toggle>
                          </Card.Header>
                          <Accordion.Collapse eventKey="1">
                            <Card.Body id="transparente">{`Tickets: ${sorteado.tickets}`}</Card.Body>
                          </Accordion.Collapse>
                        </Card>
                      </Accordion>
                    </ListGroup.Item>
                  </ListGroup>
                </div>
              ))}
            </div>
          </Container>
        ) : null}
      </main>

      <footer></footer>
    </div>
  );
}
