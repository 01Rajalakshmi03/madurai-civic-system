import os
import pickle
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.preprocessing import LabelEncoder
import nltk
from nltk.corpus import stopwords
import re
import hashlib
from difflib import SequenceMatcher

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords', quiet=True)
    nltk.download('punkt', quiet=True)

class ComplaintClassifier:
    CATEGORIES = [
        'road_damage', 'garbage_accumulation', 'water_leakage',
        'drainage_problem', 'streetlight_failure', 'illegal_dumping',
        'infrastructure_damage', 'other'
    ]

    CATEGORY_KEYWORDS = {
        'road_damage': ['road', 'pothole', 'speed breaker', 'road surface', 'footpath', 'pavement', 'road crack'],
        'garbage_accumulation': ['garbage', 'waste', 'trash', 'rubbish', 'dump', 'litter', 'bin', 'solid waste'],
        'water_leakage': ['water leak', 'pipe burst', 'water flow', 'tap', 'water supply', 'leaking pipe', 'water wastage'],
        'drainage_problem': ['drain', 'sewage', 'blockage', 'manhole', 'drainage', 'stagnant water', 'mosquito'],
        'streetlight_failure': ['street light', 'lamp', 'light pole', 'street lamp', 'no light', 'dark', 'illumination'],
        'illegal_dumping': ['illegal dump', 'construction waste', 'debris', 'hazardous waste', 'unauthorized dumping'],
        'infrastructure_damage': ['bridge', 'flyover', 'park', 'bench', 'public toilet', 'fence', 'railing', 'signage']
    }

    PRIORITY_KEYWORDS = {
        'emergency': ['emergency', 'urgent', 'immediate', 'accident', 'hazard', 'danger', 'critical', 'life threatening'],
        'high': ['severe', 'major', 'serious', 'large', 'widespread', 'blocked', 'completely'],
        'medium': ['moderate', 'partial', 'some', 'affected', 'damage'],
        'low': ['minor', 'small', 'slight', 'little', 'cosmetic']
    }

    def __init__(self):
        self.category_vectorizer = TfidfVectorizer(max_features=1000, ngram_range=(1, 2))
        self.category_model = MultinomialNB()
        self.category_encoder = LabelEncoder()
        self.priority_vectorizer = TfidfVectorizer(max_features=500, ngram_range=(1, 2))
        self.priority_model = MultinomialNB()
        self.priority_encoder = LabelEncoder()
        self.is_trained = False
        self.model_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'ai_models')
        os.makedirs(self.model_dir, exist_ok=True)

    def _preprocess(self, text):
        text = str(text).lower()
        text = re.sub(r'[^a-zA-Z\s]', ' ', text)
        stop_words = set(stopwords.words('english'))
        words = [w for w in text.split() if w not in stop_words and len(w) > 2]
        return ' '.join(words)

    def _keyword_predict_category(self, text):
        text_lower = text.lower()
        scores = {}
        for category, keywords in self.CATEGORY_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            if score > 0:
                scores[category] = score
        if scores:
            return max(scores, key=scores.get)
        return 'other'

    def _keyword_predict_priority(self, text):
        text_lower = text.lower()
        scores = {}
        for priority, keywords in self.PRIORITY_KEYWORDS.items():
            score = sum(2 if kw in text_lower else 0 for kw in keywords)
            if score > 0:
                scores[priority] = score
        if scores:
            return max(scores, key=scores.get)
        return 'medium'

    def train(self, data=None):
        if data and len(data) > 10:
            try:
                df = pd.DataFrame(data)
                df['processed'] = df['description'].apply(self._preprocess)

                X_cat = self.category_vectorizer.fit_transform(df['processed'])
                y_cat = self.category_encoder.fit_transform(df['category'])
                self.category_model.fit(X_cat, y_cat)

                X_pri = self.priority_vectorizer.fit_transform(df['processed'])
                y_pri = self.priority_encoder.fit_transform(df['priority'])
                self.priority_model.fit(X_pri, y_pri)

                self.is_trained = True
                self._save_models()
                return True
            except Exception as e:
                print(f"Training error: {e}")
        return False

    def predict_category(self, description, title=''):
        text = f"{title} {description}"
        processed = self._preprocess(text)
        keyword_pred = self._keyword_predict_category(text)

        if self.is_trained:
            try:
                X = self.category_vectorizer.transform([processed])
                pred = self.category_model.predict(X)
                probs = self.category_model.predict_proba(X)
                category = self.category_encoder.inverse_transform(pred)[0]
                confidence = float(max(probs[0]))
                if confidence > 0.3:
                    return {'category': category, 'confidence': confidence, 'method': 'ml'}
            except:
                pass

        return {
            'category': keyword_pred,
            'confidence': 0.7,
            'method': 'keyword'
        }

    def predict_priority(self, description, title='', category=''):
        text = f"{title} {description} {category}"
        processed = self._preprocess(text)
        keyword_pred = self._keyword_predict_priority(text)

        if self.is_trained:
            try:
                X = self.priority_vectorizer.transform([processed])
                pred = self.priority_model.predict(X)
                probs = self.priority_model.predict_proba(X)
                priority = self.priority_encoder.inverse_transform(pred)[0]
                confidence = float(max(probs[0]))
                if confidence > 0.3:
                    return {'priority': priority, 'confidence': confidence, 'method': 'ml'}
            except:
                pass

        return {
            'priority': keyword_pred,
            'confidence': 0.65,
            'method': 'keyword'
        }

    def detect_duplicate(self, description, location, existing_complaints):
        processed_new = self._preprocess(description)
        location_str = f"{location.get('coordinates', [0, 0])}"
        new_hash = hashlib.md5(processed_new.encode()).hexdigest()

        for existing in existing_complaints:
            existing_desc = self._preprocess(existing.get('description', ''))
            existing_hash = hashlib.md5(existing_desc.encode()).hexdigest()

            text_similarity = SequenceMatcher(None, processed_new, existing_desc).ratio()

            existing_loc = existing.get('location', {})
            existing_coords = existing_loc.get('coordinates', [0, 0])
            new_coords = location.get('coordinates', [0, 0])

            if len(existing_coords) == 2 and len(new_coords) == 2:
                dist = np.sqrt((existing_coords[0] - new_coords[0])**2 + (existing_coords[1] - new_coords[1])**2)
                location_near = dist < 0.01
            else:
                location_near = False

            if text_similarity > 0.85 and location_near:
                return {
                    'is_duplicate': True,
                    'duplicate_of': str(existing.get('id', '')),
                    'similarity': text_similarity,
                    'reason': 'Similar description and nearby location'
                }

        return {'is_duplicate': False, 'similarity': 0.0}

    def analyze_sentiment(self, text):
        positive_words = {'good', 'great', 'excellent', 'happy', 'satisfied', 'thank', 'thanks', 'helpful', 'quick',
                          'fast', 'wonderful', 'nice', 'clean', 'beautiful', 'improved', 'better'}
        negative_words = {'bad', 'worst', 'terrible', 'angry', 'frustrated', 'useless', 'waste', 'poor', 'slow',
                          'delay', 'neglect', 'ignored', 'dirty', 'disgusting', 'horrible', 'pathetic', 'shame'}
        neutral_words = {'ok', 'okay', 'fine', 'moderate', 'average', 'normal', 'usual'}

        words = set(self._preprocess(text).split())
        pos_count = len(words & positive_words)
        neg_count = len(words & negative_words)
        neu_count = len(words & neutral_words)

        if pos_count > neg_count and pos_count > neu_count:
            return 'positive'
        elif neg_count > pos_count:
            return 'negative'
        else:
            return 'neutral'

    def _save_models(self):
        try:
            models = {
                'category_vectorizer': self.category_vectorizer,
                'category_model': self.category_model,
                'category_encoder': self.category_encoder,
                'priority_vectorizer': self.priority_vectorizer,
                'priority_model': self.priority_model,
                'priority_encoder': self.priority_encoder
            }
            for name, model in models.items():
                path = os.path.join(self.model_dir, f'{name}.pkl')
                with open(path, 'wb') as f:
                    pickle.dump(model, f)
        except Exception as e:
            print(f"Model save error: {e}")

    def load_models(self):
        try:
            for name in ['category_vectorizer', 'category_model', 'category_encoder',
                         'priority_vectorizer', 'priority_model', 'priority_encoder']:
                path = os.path.join(self.model_dir, f'{name}.pkl')
                if os.path.exists(path):
                    with open(path, 'rb') as f:
                        setattr(self, name, pickle.load(f))
            self.is_trained = True
            return True
        except:
            return False

classifier = ComplaintClassifier()
