import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Trash2, Plus } from 'lucide-react';

const ProfilePanel = ({ userProfile, onDeleteIdentifier, onClose }) => {
    const [showConfirm, setShowConfirm] = useState(null);

    const identifiers = [];
    if (userProfile?.has_personal_info || userProfile?.personal_email_hash) {
        identifiers.push({ type: 'Email', value: 'Set' });
    }
    if (userProfile?.has_personal_info || userProfile?.phone_hash) {
        identifiers.push({ type: 'Phone', value: 'Set' });
    }
    if (userProfile?.custom_identifiers && Array.isArray(userProfile.custom_identifiers)) {
        userProfile.custom_identifiers.forEach((id) => {
            identifiers.push({ type: id.name || 'Custom', value: 'Set' });
        });
    }

    return (
        <div className="profile-panel-overlay">
            <div className="profile-panel-modal">
                <Card>
                    <CardHeader>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <CardTitle>My Identifiers</CardTitle>
                            <Button variant="ghost" onClick={onClose}><X size={20} /></Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {identifiers.length === 0 ? (
                            <div className="empty-state">No identifiers found.</div>
                        ) : (
                            <ul className="identifier-list">
                                {identifiers.map((id, idx) => (
                                    <li key={idx} className="identifier-item">
                                        <span className="identifier-type">{id.type}:</span>
                                        <span className="identifier-value">{id.value}</span>
                                        <Button variant="outline" size="icon" onClick={() => setShowConfirm(idx)} style={{ marginLeft: 8 }}>
                                            <Trash2 size={16} />
                                        </Button>
                                        {showConfirm === idx && (
                                            <div className="confirm-delete">
                                                <span>Delete this {id.type}?</span>
                                                <Button size="sm" onClick={() => { setShowConfirm(null); onDeleteIdentifier(id); }}>Yes</Button>
                                                <Button size="sm" variant="outline" onClick={() => setShowConfirm(null)}>No</Button>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                        {/* Optionally, add a button to add new custom identifiers */}
                        {/* <Button className="add-identifier-btn"><Plus size={16} /> Add Identifier</Button> */}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ProfilePanel;
