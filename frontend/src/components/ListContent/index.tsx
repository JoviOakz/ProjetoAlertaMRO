import { useEffect, useState, useMemo } from 'react';
import { api } from '@/services/api';
import './listcontent.css';

export interface MaterialAcimaMedia {
    pn: string;
    mrp: string;
    data: string;
    valorMedia: number;
    consumoMesAtual: number;
}

export interface MaterialTendencia {
    pn: string;
    mrp: string;
    data: string;
    descricao: string;
    status: 'Subindo' | 'Estável';
}

interface ListaApiResponse {
    materiaisMedia: MaterialAcimaMedia[];
    materiaisTendencia: MaterialTendencia[];
}

type SortField = 'pn' | 'mrp' | 'data' | 'valorMedia' | 'consumoMesAtual';
type SortOrder = 'asc' | 'desc';

const ListContent = () => {
    const [materiaisMedia, setMateriaisMedia] = useState<MaterialAcimaMedia[]>([]);
    const [materiaisTendencia, setMateriaisTendencia] = useState<MaterialTendencia[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const [sortField, setSortField] = useState<SortField>('valorMedia');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
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

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const sortedMateriaisMedia = useMemo(() => {
        return [...materiaisMedia].sort((a, b) => {
            const valA = a[sortField];
            const valB = b[sortField];

            if (typeof valA === 'string' && typeof valB === 'string') {
                return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }

            if (Number(valA) < Number(valB)) return sortOrder === 'asc' ? -1 : 1;
            if (Number(valA) > Number(valB)) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }, [materiaisMedia, sortField, sortOrder]);

    const renderArrow = (field: SortField) => {
        if (sortField !== field) return '▼';
        return sortOrder === 'asc' ? '▲' : '▼';
    };

    return (
        <section className='lista-container'>
            <h1 className='page-title'>Lista</h1>

            <div className='tables-grid'>
                {/* Tabela 1: Materiais > Média */}
                <div className='table-card'>
                    <h2 className='card-title'>MATERIAIS QUE ATINGIRAM A MÉDIA NOS ÚLTIMOS 3 MESES</h2>
                    {/* <h2 className='card-title'>MATERIAIS &gt; MÉDIA ÚLTIMOS 3 MESES</h2> */}
                    <div className='table-wrapper'>
                        <table className='custom-table'>
                            <thead>
                                <tr>
                                    <th onClick={() => handleSort('pn')} style={{ cursor: 'pointer' }}>
                                        <div className='th-content'>
                                            <span>PartNumber</span>
                                            <button className='filter-btn' title='Filtrar'>{renderArrow('pn')}</button>
                                        </div>
                                    </th>
                                    <th onClick={() => handleSort('mrp')} style={{ cursor: 'pointer' }}>
                                        <div className='th-content'>
                                            <span>MRP</span>
                                            <button className='filter-btn' title='Filtrar'>{renderArrow('mrp')}</button>
                                        </div>
                                    </th>
                                    <th onClick={() => handleSort('data')} style={{ cursor: 'pointer' }}>
                                        <div className='th-content'>
                                            <span>Data ultrapassagem</span>
                                            <button className='filter-btn' title='Filtrar'>{renderArrow('data')}</button>
                                        </div>
                                    </th>
                                    <th onClick={() => handleSort('valorMedia')} style={{ cursor: 'pointer' }}>
                                        <div className='th-content'>
                                            <span>Média</span>
                                            <button className='filter-btn' title='Filtrar'>{renderArrow('valorMedia')}</button>
                                        </div>
                                    </th>
                                    <th onClick={() => handleSort('consumoMesAtual')} style={{ cursor: 'pointer' }}>
                                        <div className='th-content'>
                                            <span>Retirado</span>
                                            <button className='filter-btn' title='Filtrar'>{renderArrow('consumoMesAtual')}</button>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className='loading-td'>Carregando...</td>
                                    </tr>
                                ) : sortedMateriaisMedia.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className='empty-td'>Nenhum registro encontrado</td>
                                    </tr>
                                ) : (
                                    sortedMateriaisMedia.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.pn}</td>
                                            <td>{item.mrp}</td>
                                            <td>{item.data}</td>
                                            <td>{item.valorMedia}</td>
                                            <td>{item.consumoMesAtual}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Tabela 2: Materiais com Mudança de Tendência */}
                <div className='table-card'>
                    <h2 className='card-title'>MATERIAIS COM MUDANÇA DE TENDÊNCIA</h2>
                    <div className='table-wrapper'>
                        <table className='custom-table'>
                            <thead>
                                <tr>
                                    <th>PN</th>
                                    <th>MRP</th>
                                    <th>DESCRIÇÃO</th>
                                    <th className='text-right'>STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className='loading-td'>Carregando...</td>
                                    </tr>
                                ) : materiaisTendencia.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className='empty-td'>Nenhum registro encontrado</td>
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