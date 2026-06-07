// src/types/index.ts

export type Role = 'professor' | 'corregente' | 'coordenador' | 'diretora' | 'sme'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  active: boolean
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
}

export interface Unidade {
  id: string
  name: string
  type: 'cmei' | 'escola'
  address?: string
  active: boolean
}

export interface Turma {
  id: string
  name: string
  year: number
  unidadeId: string
  unidade?: { id: string; name: string }
  active: boolean
  tipoVinculo?: 'regente' | 'corregente'
  _count?: { alunos: number }
  vinculos?: ProfessorTurma[]
}

export interface ProfessorTurma {
  id: string
  professorId: string
  turmaId: string
  tipoVinculo: 'regente' | 'corregente'
  dataInicio: string
  dataFim: string | null
  ativo: boolean
  professor?: { id: string; name: string; role: Role }
}

export interface Aluno {
  id: string
  name: string
  birthDate?: string
  turmaId: string
  turma?: { id: string; name: string }
  active: boolean
  _count?: { registros: number; pareceres: number }
}

export type PlanejamentoStatus = 'rascunho' | 'enviado' | 'vistado' | 'devolvido'
export type ModalidadeProposta = 'dirigida' | 'livre' | 'externa'
export type TipoProposta =
  | 'escrita' | 'leitura' | 'jogo' | 'brincadeira' | 'arte'
  | 'musica' | 'movimento' | 'exploracao' | 'experiencia'
  | 'roda_conversa' | 'outro'

export interface Proposta {
  id?: string
  dayOfWeek: number
  tipo: TipoProposta
  descricao: string
  modalidade: ModalidadeProposta
}

export interface Planejamento {
  id: string
  professorId: string
  turmaId: string
  weekStart: string
  camposExperiencia: string[]
  objetivos?: string
  conteudos?: string
  mobilizacao?: string
  desenvolvimentoPropostas?: string
  anotacoesFinais?: string
  status: PlanejamentoStatus
  coordenadorVisto: boolean
  coordenadorObs?: string
  vistadoPor?: string
  professor?: { id: string; name: string }
  turma?: { id: string; name: string }
  propostas?: Proposta[]
  createdAt: string
  updatedAt: string
}

export interface RegistroAnexo {
  id: string
  filename: string
  mimeType: string
  storageUrl: string
  sizeBytes: number
}

export interface Registro {
  id: string
  professorId: string
  alunoId: string
  turmaId: string
  date: string
  observacao: string
  coordenadorObs?: string
  vistado: boolean
  professor?: { id: string; name: string }
  aluno?: { id: string; name: string }
  turma?: { id: string; name: string }
  anexos?: RegistroAnexo[]
  createdAt: string
}

export type ParecerStatus = 'rascunho' | 'finalizado'

export interface Parecer {
  id: string
  professorId: string
  alunoId: string
  period: string
  textIa?: string
  textFinal?: string
  header?: string
  intro?: string
  pdfUrl?: string
  status: ParecerStatus
  geradoEmSubst: boolean
  substitutoPor?: string
  professor?: { id: string; name: string }
  aluno?: { id: string; name: string }
  createdAt: string
  updatedAt: string
}

export interface Notificacao {
  id: string
  userId: string
  title: string
  message: string
  read: boolean
  link?: string
  createdAt: string
}

export interface CampoExperiencia {
  id: string
  label: string
  count?: number
}

export const CAMPOS_EXPERIENCIA: CampoExperiencia[] = [
  { id: 'o_eu_outro_nos', label: 'O Eu, o Outro e o Nós' },
  { id: 'corpo_gestos_movimentos', label: 'Corpo, Gestos e Movimentos' },
  { id: 'tracos_sons_cores_formas', label: 'Traços, Sons, Cores e Formas' },
  { id: 'escuta_fala_pensamento_imaginacao', label: 'Escuta, Fala, Pensamento e Imaginação' },
  { id: 'espacos_tempos_quantidades', label: 'Espaços, Tempos, Quantidades, Relações e Transformações' },
]

export const CAMPOS_EXPERIENCIA_COLORS: Record<string, string> = {
  o_eu_outro_nos:                    '#A8C5B5',
  corpo_gestos_movimentos:           '#BBD7E8',
  tracos_sons_cores_formas:          '#FAD9A6',
  escuta_fala_pensamento_imaginacao: '#F7BFAE',
  espacos_tempos_quantidades:        '#DCC7E7',
}

export const ROLE_LABELS: Record<Role, string> = {
  professor:   'Professor(a) Regente',
  corregente:  'Professora Corregente',
  coordenador: 'Coordenador(a) Pedagógico(a)',
  diretora:    'Diretora',
  sme:         'SME',
}

export const ROLE_COLORS: Record<Role, string> = {
  professor:   'badge-green',
  corregente:  'badge-blue',
  coordenador: 'badge-salmon',
  diretora:    'badge-lavender',
  sme:         'badge-yellow',
}

export const TIPO_PROPOSTA_LABELS: Record<TipoProposta, string> = {
  escrita:      'Escrita',
  leitura:      'Leitura',
  jogo:         'Jogo',
  brincadeira:  'Brincadeira',
  arte:         'Arte',
  musica:       'Música',
  movimento:    'Movimento',
  exploracao:   'Exploração',
  experiencia:  'Experiência',
  roda_conversa:'Roda de Conversa',
  outro:        'Outro',
}

export const MODALIDADE_LABELS: Record<ModalidadeProposta, string> = {
  dirigida: 'Dirigida',
  livre:    'Livre',
  externa:  'Externa',
}

export const MODALIDADE_COLORS: Record<ModalidadeProposta, string> = {
  dirigida: '#A8C5B5',
  livre:    '#BBD7E8',
  externa:  '#FAD9A6',
}

export const STATUS_PLANEJAMENTO_LABELS: Record<PlanejamentoStatus, string> = {
  rascunho: 'Rascunho',
  enviado:  'Enviado',
  vistado:  'Vistado',
  devolvido:'Devolvido',
}

export const STATUS_PLANEJAMENTO_COLORS: Record<PlanejamentoStatus, string> = {
  rascunho: 'badge-gray',
  enviado:  'badge-blue',
  vistado:  'badge-green',
  devolvido:'badge-salmon',
}
