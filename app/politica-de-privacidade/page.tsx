import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade | Doceria Brigadeiro & Beijinho",
  description:
    "Saiba como a Doceria Brigadeiro & Beijinho trata os dados pessoais informados em pedidos e contatos.",
  robots: { index: true, follow: true },
};

const updatedAt = "10 de outubro de 2026";

export default function PoliticaDePrivacidadePage() {
  return (
    <main
      style={{
        maxWidth: 880,
        margin: "0 auto",
        padding: "48px 24px 72px",
        color: "#302824",
        fontFamily: "Arial, Helvetica, sans-serif",
        lineHeight: 1.7,
      }}
    >
      <a
        href="/"
        style={{
          display: "inline-block",
          marginBottom: 24,
          color: "#7a4437",
          textDecoration: "underline",
        }}
      >
        Voltar ao site
      </a>

      <header style={{ marginBottom: 32 }}>
        <p
          style={{
            margin: "0 0 8px",
            color: "#7a4437",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Doceria Brigadeiro &amp; Beijinho
        </p>
        <h1 style={{ margin: "0 0 12px", fontSize: "clamp(30px, 5vw, 42px)", lineHeight: 1.15 }}>
          Política de Privacidade
        </h1>
        <p style={{ margin: 0, color: "#6b625d", fontSize: 14 }}>
          Última atualização: {updatedAt}
        </p>
      </header>

      <p>
        Esta Política de Privacidade explica como a Doceria Brigadeiro &amp; Beijinho
        coleta, utiliza, armazena e compartilha dados pessoais quando você acessa
        nosso site, solicita um orçamento, faz um pedido ou entra em contato conosco.
        Tratamos os dados de acordo com a legislação aplicável de proteção de dados,
        incluindo a Lei Geral de Proteção de Dados Pessoais (LGPD).
      </p>

      <section>
        <h2>1. Quais dados podemos coletar</h2>
        <p>De acordo com a sua interação com a doceria, podemos tratar:</p>
        <ul>
          <li>dados de identificação e contato, como nome e número de telefone/WhatsApp;</li>
          <li>dados necessários para a encomenda, como produtos, quantidades, sabores, personalização, data e horário solicitados;</li>
          <li>dados de entrega ou retirada, como endereço e CEP, quando necessários;</li>
          <li>informações sobre o pedido, valores, forma de pagamento escolhida e andamento da encomenda;</li>
          <li>mensagens e informações que você decidir enviar durante o atendimento, inclusive referências de decoração.</li>
        </ul>
      </section>

      <section>
        <h2>2. Para que utilizamos os dados</h2>
        <p>Utilizamos os dados pessoais para:</p>
        <ul>
          <li>responder a dúvidas, preparar orçamentos e atender solicitações;</li>
          <li>registrar, organizar e acompanhar pedidos;</li>
          <li>conferir disponibilidade, combinar detalhes, entrega ou retirada e entrar em contato sobre a encomenda;</li>
          <li>calcular valores, organizar pagamentos e manter registros administrativos;</li>
          <li>melhorar o funcionamento e a segurança do site e prevenir fraudes ou uso indevido;</li>
          <li>cumprir obrigações legais e regulatórias, quando aplicável.</li>
        </ul>
      </section>

      <section>
        <h2>3. WhatsApp e outros prestadores de serviço</h2>
        <p>
          Podemos utilizar serviços de terceiros para viabilizar o atendimento e a
          operação da doceria. Isso inclui o WhatsApp/Meta para comunicação com clientes,
          além de ferramentas de hospedagem do site e serviços do Google para organizar
          registros de pedidos e agenda. Esses serviços podem tratar dados conforme suas
          próprias políticas e configurações.
        </p>
        <p>
          Compartilhamos apenas os dados necessários para a finalidade correspondente,
          e não vendemos dados pessoais.
        </p>
      </section>

      <section>
        <h2>4. Pagamentos</h2>
        <p>
          O site pode apresentar instruções ou opções para pagamento por Pix ou cartão.
          Não informe senhas, códigos de segurança ou credenciais bancárias em mensagens.
          Quando o pagamento é processado por um serviço externo, os dados inseridos
          nesse serviço são tratados conforme as regras e políticas do respectivo
          prestador.
        </p>
      </section>

      <section>
        <h2>5. Armazenamento e segurança</h2>
        <p>
          Mantemos os dados pelo período necessário para atender às finalidades descritas
          nesta política, administrar pedidos e cumprir obrigações legais. Adotamos
          medidas razoáveis para proteger as informações, mas nenhum meio de transmissão
          ou armazenamento eletrônico é totalmente seguro.
        </p>
      </section>

      <section>
        <h2>6. Cookies e dados de navegação</h2>
        <p>
          O site e sua infraestrutura de hospedagem podem utilizar recursos técnicos
          necessários para disponibilizar, manter e proteger a página. Caso sejam
          utilizados cookies ou tecnologias adicionais de análise ou publicidade, esta
          política deverá ser atualizada para descrevê-los de forma específica.
        </p>
      </section>

      <section>
        <h2>7. Seus direitos</h2>
        <p>
          Nos termos da legislação aplicável, você pode solicitar confirmação do
          tratamento, acesso, correção, atualização ou exclusão de dados, quando cabível,
          além de esclarecimentos sobre o uso de suas informações. Algumas informações
          podem precisar ser mantidas para cumprimento de obrigações legais ou exercício
          regular de direitos.
        </p>
      </section>

      <section>
        <h2>8. Privacidade de crianças e adolescentes</h2>
        <p>
          Nosso site é destinado à divulgação de produtos e ao atendimento de encomendas.
          Não solicitamos intencionalmente dados pessoais de crianças sem a participação
          de um responsável legal.
        </p>
      </section>

      <section>
        <h2>9. Alterações nesta política</h2>
        <p>
          Podemos atualizar esta política para refletir mudanças nos serviços, nas
          práticas de tratamento de dados ou nas exigências legais. A versão vigente
          será publicada nesta página com a data de atualização.
        </p>
      </section>

      <section>
        <h2>10. Contato sobre privacidade</h2>
        <p>
          Para dúvidas ou solicitações relacionadas aos seus dados pessoais, entre em
          contato com a Doceria Brigadeiro &amp; Beijinho pelo WhatsApp:
          {" "}
          <a
            href="https://wa.me/5531973416110"
            style={{ color: "#7a4437", textDecoration: "underline" }}
          >
            +55 31 7341-6110
          </a>
          .
        </p>
      </section>

      <footer
        style={{
          marginTop: 40,
          paddingTop: 20,
          borderTop: "1px solid #e4d9d2",
          color: "#6b625d",
          fontSize: 13,
        }}
      >
        © {new Date().getFullYear()} Doceria Brigadeiro &amp; Beijinho.
      </footer>
    </main>
  );
}
