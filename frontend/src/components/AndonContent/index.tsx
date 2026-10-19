import { useEffect, useState, useMemo } from 'react';
import { api } from '@/services/api';
import './andoncontent.css';

export interface AndonItem {
    partNumber: string;
    description: string;
    responsavel: string;
    comentarios: string;
    status: 'Nenhuma ação' | 'Em análise' | 'Concluido' | 'Concluído';
}

type SortField = 'partNumber' | 'description' | 'responsavel' | 'status';
type SortOrder = 'asc' | 'desc';

const AndonContent = () => {
    const [andonData, setAndonData] = useState<AndonItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [sortField, setSortField] = useState<SortField>('partNumber');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await api.get('/andon');

                const rawData = Array.isArray(response.data)
                    ? response.data
                    : (response.data?.data || []);

                const normalizedData: AndonItem[] = rawData.map((item: any) => ({
                    partNumber: item.partNumber || item.part_number || item.material || item.pn || '',
                    // Garante que vai ler qualquer variação e aplicar o fallback caso venha vazio/nulo
                    description: item.description || item.descricao || item.desc || 'Sem Descrição',
                    responsavel: item.responsavel || item.mrp_id || item.mrp || 'N/D',
                    comentarios: item.comentarios || '',
                    status: item.status || item.status_tratativa || 'Nenhuma ação'
                }));

                setAndonData(normalizedData);
            } catch (error) {
                console.error('Erro ao buscar dados do Andon:', error);
                setAndonData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const updateItemOnServer = async (partNumber: string, updatedFields: Partial<AndonItem>) => {
        try {
            await api.put(`/andon/${partNumber}`, updatedFields);
        } catch (error) {
            console.error(`Erro ao atualizar o item ${partNumber}:`, error);
        }
    };

    const handleCommentChange = (partNumber: string, newValue: string) => {
        setAndonData(prev => prev.map(item =>
            item.partNumber === partNumber ? { ...item, comentarios: newValue } : item
        ));
    };

    const handleCommentBlur = (item: AndonItem) => {
        updateItemOnServer(item.partNumber, {
            comentarios: item.comentarios,
            status: item.status
        });
    };

    const handleStatusChange = (partNumber: string, newStatus: AndonItem['status']) => {
        setAndonData(prev => prev.map(item =>
            item.partNumber === partNumber ? { ...item, status: newStatus } : item
        ));

        const itemToUpdate = andonData.find(i => i.partNumber === partNumber);
        if (itemToUpdate) {
            updateItemOnServer(partNumber, {
                comentarios: itemToUpdate.comentarios,
                status: newStatus
            });
        }
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const sortedAndonData = useMemo(() => {
        if (!Array.isArray(andonData)) return [];
        return [...andonData].sort((a, b) => {
            const valA = String(a[sortField] ?? '');
            const valB = String(b[sortField] ?? '');
            return sortOrder === 'asc'
                ? valA.localeCompare(valB)
                : valB.localeCompare(valA);
        });
    }, [andonData, sortField, sortOrder]);

    const renderArrow = (field: SortField) => {
        if (sortField !== field) return '▼';
        return sortOrder === 'asc' ? '▲' : '▼';
    };

    return (
        <section className='andon-container'>
            <h1 className='page-title'>Andon</h1>

            <div className='andon-card'>
                <div className='table-wrapper'>
                    <table className='andon-table custom-table'>
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('partNumber')}>
                                    <div className='th-content'>
                                        <span>PART NUMBER</span>
                                        <button className='filter-btn'>{renderArrow('partNumber')}</button>
                                    </div>
                                </th>
                                <th onClick={() => handleSort('description')}>
                                    <div className='th-content'>
                                        <span>DESCRIÇÃO</span>
                                        <button className='filter-btn'>{renderArrow('description')}</button>
                                    </div>
                                </th>
                                <th onClick={() => handleSort('responsavel')}>
                                    <div className='th-content'>
                                        <span>RESPONSÁVEL (MRP)</span>
                                        <button className='filter-btn'>{renderArrow('responsavel')}</button>
                                    </div>
                                </th>
                                <th>
                                    <div className='th-content'>
                                        <span>COMENTÁRIOS</span>
                                    </div>
                                </th>
                                <th onClick={() => handleSort('status')}>
                                    <div className='th-content'>
                                        <span>STATUS</span>
                                        <button className='filter-btn'>{renderArrow('status')}</button>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className='state-td'>Carregando...</td>
                                </tr>
                            ) : sortedAndonData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className='state-td'>Nenhum registro no Andon</td>
                                </tr>
                            ) : (
                                sortedAndonData.map((item, index) => (
                                    <tr key={item.partNumber || index}>
                                        <td className='font-bold'>{item.partNumber}</td>
                                        <td>{item.description}</td>
                                        <td>{item.responsavel}</td>

                                        <td>
                                            <input
                                                type="text"
                                                className="andon-input-comentario"
                                                value={item.comentarios || ''}
                                                onChange={(e) => handleCommentChange(item.partNumber, e.target.value)}
                                                onBlur={() => handleCommentBlur(item)}
                                                placeholder="Adicionar comentário..."
                                            />
                                        </td>

                                        <td>
                                            <select
                                                className={`andon-select-status ${(item.status || '').toLowerCase().replace(' ', '-')}`}
                                                value={item.status === 'Concluido' ? 'Concluído' : item.status}
                                                onChange={(e) => handleStatusChange(item.partNumber, e.target.value as AndonItem['status'])}
                                            >
                                                <option value="Nenhuma ação">Nenhuma ação</option>
                                                <option value="Em análise">Em análise</option>
                                                <option value="Concluído">Concluído</option>
                                            </select>
                                        </td>
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