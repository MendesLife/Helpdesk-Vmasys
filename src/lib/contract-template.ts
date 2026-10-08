export interface ContractCompanyData {
  id: string;
  name: string;
  document?: string | null;
  billingDay?: number | null;
  customPrice?: number | null;
  paymentMethod?: string | null;
  plan?: {
    name: string;
    price: number;
    maxSites: number;
    maxPages?: number | null;
    monthlyRequestsLimit?: number | null;
    slaHours?: number | null;
    features?: string | null;
  } | null;
}

export function generateDefaultContractTerms(company: ContractCompanyData): string {
  const planName = company.plan?.name || "Plano Sob Medida";
  const monthlyPrice = company.customPrice !== null && company.customPrice !== undefined
    ? company.customPrice
    : company.plan?.price || 0;
  
  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(monthlyPrice);

  const billingDay = company.billingDay || 10;
  const paymentMethod = company.paymentMethod || "PIX";
  const maxSites = company.plan?.maxSites || 1;
  const maxPages = company.plan?.maxPages ? `${company.plan.maxPages} páginas` : "Ilimitadas";
  const monthlyRequests = company.plan?.monthlyRequestsLimit ? `${company.plan.monthlyRequestsLimit} solicitações` : "Ilimitadas";
  const slaHours = company.plan?.slaHours || 48;

  return `INSTRUMENTO PARTICULAR DE PRESTAÇÃO DE SERVIÇOS DE DESENVOLVIMENTO WEB, HOSPEDAGEM GERENCIADA E SUPORTE POR ASSINATURA

Pelo presente instrumento particular, de um lado:

CONTRATADA:
VMASYS SOLUÇÕES DIGITAIS & TECNOLOGIA WEB
Plataforma de Criação de Sites e Suporte Técnico Gerenciado
E-mail de Contato: suporte@vmasys.com.br

E, de outro lado:

CONTRATANTE:
Razão Social / Nome: ${company.name}
Documento (CNPJ/CPF): ${company.document || "A ser informado no cadastro oficial"}

Têm entre si, justo e contratado, o presente Contrato de Prestação de Serviços por Assinatura Contínua, que se regerá pelas seguintes cláusulas e condições:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLÁUSULA 1ª - DO OBJETO E ESCOPO DOS SERVIÇOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1.1. O presente contrato tem por objeto a prestação contínua de serviços digitais pela CONTRATADA em favor da CONTRATANTE, compreendendo:
  a) Criação, layout e desenvolvimento das páginas do website contratado, em conformidade com as orientações aprovadas no Briefing do Projeto;
  b) Hospedagem em servidores de alta performance, monitoramento e certificado de segurança SSL ativado;
  c) Realização de rotinas periódicas de backup e atualizações de segurança;
  d) Suporte técnico contínuo e atendimento a chamados de manutenção e atualização de conteúdo através do Portal VMASYS Helpdesk.

1.2. O escopo específico do plano contratado (${planName}) compreende os seguintes parâmetros operacionais:
  • Quantidade de Sites Inclusos: ${maxSites} site(s)
  • Limite de Páginas Inclusas: ${maxPages}
  • Limite de Alterações Mensais: ${monthlyRequests}
  • Prazo de Atendimento (SLA): Até ${slaHours} horas úteis por solicitação

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLÁUSULA 2ª - DO VALOR, FORMA DE PAGAMENTO E REAJUSTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2.1. Pela prestação dos serviços contratados, a CONTRATANTE pagará à CONTRATADA a mensalidade recorrente no valor de ${formattedPrice} (${monthlyPrice} reais).
2.2. O vencimento da mensalidade ocorrerá todo dia ${billingDay} de cada mês, através da modalidade ${paymentMethod} (ou link de checkout gerado pela plataforma).
2.3. O não pagamento na data aprazada sujeitará a CONTRATANTE à multa de 2% (dois por cento) sobre o valor da fatura, acrescida de juros de 1% (um por cento) ao mês.
2.4. Atrasos superiores a 15 (quinze) dias corridos autorizam a CONTRATADA a suspender temporariamente a abertura de novos chamados e o acesso às ferramentas de edição até a regularização do débito.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLÁUSULA 3ª - DO SUPORTE E ABERTURA DE SOLICITAÇÕES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3.1. Todas as demandas de alteração de conteúdo (textos, imagens, banners, links, novas páginas dentro do limite contratado) deverão ser protocoladas exclusivamente através do Portal de Chamados VMASYS Helpdesk.
3.2. As solicitações serão processadas em ordem de abertura, respeitando o SLA de até ${slaHours} horas úteis previsto no plano contratado.
3.3. Serviços que excedam substancialmente o escopo contratado (como desenvolvimento de sistemas complexos sob encomenda ou redesign completo estrutural) serão previamente orçados de forma avulsa e dependerão de aprovação expressa da CONTRATANTE.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLÁUSULA 4ª - DAS OBRIGAÇÕES DAS PARTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4.1. São obrigações da CONTRATADA:
  a) Empregar as melhores técnicas de desenvolvimento, responsividade (mobile friendly) e segurança para o website;
  b) Manter a disponibilidade dos servidores em índice não inferior a 99% (uptime);
  c) Zelar pelo sigilo e confidencialidade dos dados e informações fornecidas pela CONTRATANTE.

4.2. São obrigações da CONTRATANTE:
  a) Fornecer, em tempo hábil através do Briefing ou chamados, os materiais necessários para a composição do site (logotipo, textos, fotos e informações corporativas);
  b) Responder com exatidão pela legitimidade, direitos autorais e veracidade de todo o conteúdo veiculado no seu site;
  c) Efetuar pontualmente o pagamento das mensalidades pactuadas.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLÁUSULA 5ª - DA PROPRIEDADE INTELECTUAL E DADOS (LGPD)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5.1. Todos os direitos sobre a marca, logotipo, textos e imagens institucionais da CONTRATANTE permanecem de sua exclusiva e plena titularidade.
5.2. As partes declaram observar rigorosamente a legislação brasileira de proteção de dados (Lei nº 13.709/2018 - LGPD), comprometendo-se a manter medidas cabíveis para proteção dos dados dos visitantes e clientes do website.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLÁUSULA 6ª - DO PRAZO, VIGÊNCIA E RESCISÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6.1. O presente contrato vigora por prazo indeterminado, a contar da data de sua assinatura eletrônica.
6.2. Qualquer das partes poderá rescindir o presente contrato, sem aplicação de multas rescisórias, mediante comunicação expressa com antecedência mínima de 30 (trinta) dias.
6.3. Em caso de rescisão, a CONTRATADA assegurará à CONTRATANTE a exportação de todos os conteúdos de sua propriedade, bem como o apontamento ou liberação do domínio para outra hospedagem de sua escolha.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLÁUSULA 7ª - DA ASSINATURA ELETRÔNICA E VALIDADE JURÍDICA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7.1. As partes reconhecem expressamente a plena validade jurídica e eficácia probatória do presente contrato assinado por meio eletrônico, em estrita consonância com a Medida Provisória nº 2.200-2/2001 e a Lei Federal nº 14.063/2020.
7.2. Para efeito de autenticidade, o sistema armazenará no ato do aceite o nome completo do signatário, e-mail de acesso autenticado, data e horário (UTC/Brasília) e o endereço IP de conexão do dispositivo utilizado.

E, por estarem plenamente de acordo com as cláusulas e condições ajustadas, a CONTRATANTE firma o presente contrato por meio de aceite eletrônico no Portal do Cliente VMASYS.`;
}
