import React, { useState, useEffect } from 'react';
import { ClipboardCopy, FileText, Key, Loader2, MapPin } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

interface AddressData {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
}

function App() {
  const [group, setGroup] = useState('');
  const [datetime, setDatetime] = useState('');
  const [addressData, setAddressData] = useState<AddressData>({
    street: '',
    number: '',
    neighborhood: '',
    city: ''
  });
  const [description, setDescription] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [generatedReport, setGeneratedReport] = useState('');
  const [previousReport, setPreviousReport] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setApiKey('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');
  }, []);

  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getFormattedAddress = () => {
    return `${addressData.street}, ${addressData.number}, ${addressData.neighborhood}, ${addressData.city}-PR`;
  };

  const getMapUrl = () => {
    const query = encodeURIComponent(`${addressData.street} ${addressData.number} ${addressData.city} PR Brazil`);
    return `https://www.google.com/maps/embed/v1/place?key=AIzaSyD1T-wct3ZaPmOHseqH1SjkiP5pAn4Pj3Y&q=${query}&zoom=15`;
  };

  const generateReport = async (summarizeMore = false) => {
    if (!group || !datetime || !addressData.street || !addressData.city || !description) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setIsLoading(true);
    try {
      const formattedDateTime = formatDateTime(datetime);
      const formattedAddress = getFormattedAddress();
      
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: 'Você é um assistente especializado em gerar relatórios policiais técnicos da PMPR.',
            },
            {
              role: 'user',
              content: `Gere um resumo policial ${
                summarizeMore ? 'mais conciso e direto' : ''
              } com base nas seguintes informações:
                Grupo: ${group}
                Data/Hora: ${formattedDateTime}
                Endereço: ${formattedAddress}
                Descrição: ${description}
                
                Use o seguinte formato inicial:
                "Na data e horário ${formattedDateTime} a equipe ${group} deslocou até o endereço ${formattedAddress}, no local..."
                
                ${summarizeMore ? 'Faça um resumo técnico policial da PMPR em até 4 linhas.' : 'Faça um resumo técnico policial da PMPR em até 8 linhas.'}
                No final, liste:
                - Quantidade de presos
                - Número de vítimas
                - Objetos furtados/roubados
                - Objetos apreendidos`,
            },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Erro ao comunicar com a API Groq');
      }

      const data = await response.json();
      if (data.choices && data.choices[0]?.message?.content) {
        if (summarizeMore) {
          setPreviousReport(generatedReport);
        }
        setGeneratedReport(data.choices[0].message.content);
      } else {
        throw new Error('Resposta inválida da API');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar relatório. Verifique sua chave API.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Relatório copiado!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-gray-900 text-white p-6">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <FileText className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Gerador de Relatórios PMPR</h1>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5" />
              <label className="text-sm font-medium">Desenvolvido por Sd. Edson Moraes</label>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Grupo Responsável</label>
                <input
                  type="text"
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  placeholder="Ex: RPA, ROTAM, P2"
                  className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Data e Hora</label>
                <input
                  type="datetime-local"
                  value={datetime}
                  onChange={(e) => setDatetime(e.target.value)}
                  className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Rua</label>
                  <input
                    type="text"
                    value={addressData.street}
                    onChange={(e) => setAddressData(prev => ({ ...prev, street: e.target.value }))}
                    placeholder="Ex: Rua Paraguai"
                    className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Número</label>
                  <input
                    type="text"
                    value={addressData.number}
                    onChange={(e) => setAddressData(prev => ({ ...prev, number: e.target.value }))}
                    placeholder="Ex: 1165"
                    className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Bairro</label>
                  <input
                    type="text"
                    value={addressData.neighborhood}
                    onChange={(e) => setAddressData(prev => ({ ...prev, neighborhood: e.target.value }))}
                    placeholder="Ex: Centro"
                    className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Cidade</label>
                  <input
                    type="text"
                    value={addressData.city}
                    onChange={(e) => setAddressData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Ex: Medianeira"
                    className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descrição do B.O.</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Cole aqui a descrição do boletim de ocorrência"
                  className="w-full h-40 p-3 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5" />
                <h2 className="text-lg font-medium">Localização no Mapa</h2>
              </div>
              {addressData.street && addressData.city && (
                <iframe
                  title="Location Map"
                  width="100%"
                  height="450"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  src={getMapUrl()}
                  className="rounded-lg"
                />
              )}
            </div>
          </div>

          <button
            onClick={() => generateReport(false)}
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Gerando Relatório...
              </>
            ) : (
              'Gerar Relatório'
            )}
          </button>

          {generatedReport && (
            <div className="space-y-6">
              <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Relatório Atual</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => generateReport(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                      disabled={isLoading}
                    >
                      Resumir mais
                    </button>
                    <button
                      onClick={() => copyToClipboard(generatedReport)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <ClipboardCopy className="w-4 h-4" />
                      Copiar
                    </button>
                  </div>
                </div>
                <div className="whitespace-pre-wrap bg-gray-700 p-4 rounded">
                  {generatedReport}
                </div>
              </div>

              {previousReport && (
                <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Versão Anterior</h2>
                  </div>
                  <div className="whitespace-pre-wrap bg-gray-700 p-4 rounded">
                    {previousReport}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
