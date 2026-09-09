import { useEffect, useState } from 'react';
import { api } from '@/services/api'; // Ajuste o caminho de import da sua api se necessário
import './listcontent.css';

// Interfaces dos dados
export interface MaterialAcimaMedia {
    pn: string;
    mrp: string;
    descricao: string;
    valorMedia: string | number;
    delta: string | number;
}

export interface MaterialTendencia {
    pn: string;
    mrp: string;
    descricao: string;
    status: 'SUBINDO' | 'DESCENDO';
}

interface ListaApiResponse {
    materiaisMedia: MaterialAcimaMedia[];
    materiaisTendencia: MaterialTendencia[];
}

const ListContent = () => {
    const [materiaisMedia, setMateriaisMedia] = useState<MaterialAcimaMedia[]>([]);
    const [materiaisTendencia, setMateriaisTendencia] = useState<MaterialTendencia[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Chamada real para o endpoint do backend Express
                const response = await api.get<ListaApiResponse>('/lista');

                setMateriaisMedia(response.data.materiaisMedia);
                setMateriaisTendencia(response.data.materiaisTendencia);
            } catch (error) {
                console.error('Erro ao carregar dados da API:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <section className="lista-container">
            <h1 className="page-title">Lista</h1>

            <div className="tables-grid">
                {/* Tabela 1: Materiais > Média */}
                <div className="table-card">
                    <h2 className="card-title">MATERIAIS &gt; MÉDIA ÚLTIMOS 3 MESES</h2>
                    <div className="table-wrapper">
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>PN</th>
                                    <th>MRP</th>
                                    <th>DESCRIÇÃO</th>
                                    <th>VALOR MÉDIA</th>
                                    <th>DELTA</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="loading-td">Carregando...</td>
                                    </tr>
                                ) : materiaisMedia.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="empty-td">Nenhum registro encontrado</td>
                                    </tr>
                                ) : (
                                    materiaisMedia.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.pn}</td>
                                            <td>{item.mrp}</td>
                                            <td>{item.descricao}</td>
                                            <td>{item.valorMedia}</td>
                                            <td className="delta-column">{item.delta}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Tabela 2: Materiais com Mudança de Tendência */}
                <div className="table-card">
                    <h2 className="card-title">MATERIAIS COM MUDANÇA DE TENDÊNCIA</h2>
                    <div className="table-wrapper">
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>PN</th>
                                    <th>MRP</th>
                                    <th>DESCRIÇÃO</th>
                                    <th className="text-right">STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="loading-td">Carregando...</td>
                                    </tr>
                                ) : materiaisTendencia.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="empty-td">Nenhum registro encontrado</td>
                                    </tr>
                                ) : (
                                    materiaisTendencia.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.pn}</td>
                                            <td>{item.mrp}</td>
                                            <td>{item.descricao}</td>
                                            <td className={`text-right status-cell ${item.status.toLowerCase()}`}>
                                                {item.status}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ListContent;