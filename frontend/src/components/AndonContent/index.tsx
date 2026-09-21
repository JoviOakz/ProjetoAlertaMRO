import { useEffect, useState, useMemo } from 'react';
import { api } from '@/services/api';
import './andoncontent.css';

export interface AndonItem {
    partNumber: string;
    descricao: string;
    status: string;
    responsavel: string;
}

type SortField = 'partNumber' | 'descricao' | 'responsavel' | 'status';
type SortOrder = 'asc' | 'desc';

const AndonContent = () => {
    const [andonData, setAndonData] = useState<AndonItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    // Padrão inicial: decrescente ('desc')
    const [sortField, setSortField] = useState<SortField>('partNumber');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await api.get<AndonItem[]>('/andon');
                setAndonData(response.data);
            } catch (error) {
                console.error('Erro ao buscar dados do Andon:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const sortedAndonData = useMemo(() => {
        return [...andonData].sort((a, b) => {
            const valA = a[sortField] || '';
            const valB = b[sortField] || '';
            return sortOrder === 'asc'
                ? valA.localeCompare(valB)
                : valB.localeCompare(valA);
        });
    }, [andonData, sortField, sortOrder]);

    const renderArrow = (field: SortField) => {
        if (sortField !== field) return '▼'; // Padrão visual inicial para colunas inativas
        return sortOrder === 'asc' ? '▲' : '▼';
    };

    return (
        <section className='andon-container'>
            <h1 className='page-title'>Andon</h1>

            <div className='andon-card'>
                <div className='table-wrapper'>
                    <table className='andon-table'>
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('partNumber')} style={{ cursor: 'pointer' }}>
                                    <div className='th-content'>
                                        <span>PART NUMBER</span>
                                        <button className='filter-btn' title='Filtrar'>{renderArrow('partNumber')}</button>
                                    </div>
                                </th>
                                <th onClick={() => handleSort('descricao')} style={{ cursor: 'pointer' }}>
                                    <div className='th-content'>
                                        <span>DESCRIÇÃO</span>
                                        <button className='filter-btn' title='Filtrar'>{renderArrow('descricao')}</button>
                                    </div>
                                </th>
                                <th onClick={() => handleSort('responsavel')} style={{ cursor: 'pointer' }}>
                                    <div className='th-content'>
                                        <span>RESPONSÁVEL</span>
                                        <button className='filter-btn' title='Filtrar'>{renderArrow('responsavel')}</button>
                                    </div>
                                </th>
                                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                                    <div className='th-content'>
                                        <span>STATUS</span>
                                        <button className='filter-btn' title='Filtrar'>{renderArrow('status')}</button>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className='state-td'>Carregando...</td>
                                </tr>
                            ) : sortedAndonData.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className='state-td'>Nenhum registro no Andon</td>
                                </tr>
                            ) : (
                                sortedAndonData.map((item, index) => (
                                    <tr key={index}>
                                        <td className='font-bold'>{item.partNumber}</td>
                                        <td>{item.descricao}</td>
                                        <td>{item.responsavel}</td>
                                        <td>{item.status}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
};

export default AndonContent;